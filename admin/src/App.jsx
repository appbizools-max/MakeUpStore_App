import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { AdminProvider, useAdmin } from './context/AdminContext';
import {
  LayoutGrid,
  ShoppingBag,
  Eye,
  EyeOff,
  PlusCircle,
  Package,
  User,
  DollarSign,
  Star,
  TrendingUp,
  TrendingDown,
  Minus,
  ChevronDown,
  Plus,
  Search,
  Filter,
  ShieldAlert,
  UserCheck,
  CheckCircle,
  Info,
  Phone,
  Mail,
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
  AlertTriangle,
  ListOrdered,
  GripVertical,
  ArrowUp,
  ArrowDown,
  Tag,
  Award,
  BadgePlus,
  Building2,
  FolderPlus,
  Layers,
  Trash2,
  Menu,
  ChevronUp,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  AlertCircle,
  Barcode,
  Loader2,
  ExternalLink,
  ImagePlus,
  RefreshCw,
  Percent,
  BadgePercent,
  Calculator,
  Palette,
  Pipette,
  PaintBucket,
  ScanBarcode,
  CheckCircle2,
  Bell,
  ShoppingCart,
  Boxes,
  Users,
  ShieldCheck,
  Table
} from 'lucide-react';
import AllEmployeesPage from './components/employees/AllEmployeesPage';
import AddEmployeePage from './components/employees/AddEmployeePage';
import EmployeeProfilePage from './components/employees/EmployeeProfilePage';
import EditEmployeePage from './components/employees/EditEmployeePage';
import EmployeePermissionsPage from './components/employees/EmployeePermissionsPage';
import EmployeeActivityPage from './components/employees/EmployeeActivityPage';
import { hasModuleAccess } from './utils/permissionEngine';
import BarcodeScannerModal from './components/BarcodeScannerModal';
import BarcodeSearchResultModal from './components/BarcodeSearchResultModal';
import { validateBarcodeFormat } from './utils/barcodeUtils';
import { useHardwareBarcodeScanner } from './utils/useHardwareBarcodeScanner';
import { matchProductSearch, flattenProductsToIndividualVariants } from './utils/productSearchEngine';
import RoleQuantityTiersManager from './components/RoleQuantityTiersManager';
import RolePricingMatrix from './components/RolePricingMatrix';
import ShadePricingModal from './components/ShadePricingModal';
import ProductsCatalogMatrix from './components/ProductsCatalogMatrix';
import { AbandonedCartsManager } from './components/AbandonedCartsManager';
import AddNewProductPage from './components/AddNewProductPage_Redesigned';
import { BulkProductEntryModal } from './components/BulkProductEntryModal';
import AttributesMasterPage from './components/AttributesMasterPage';
import MainCategoriesManager from './components/MainCategoriesManager';
import CategorySubcategoryManager from './components/CategorySubcategoryManager';
import CustomerSearchRequestsPage from './components/CustomerSearchRequestsPage';
import B2BVerificationPage from './components/B2BVerificationPage';
import ApprovalCenterPage from './components/ApprovalCenterPage';
import AuditTrailPage from './components/AuditTrailPage';
import GeneratedDataPanel from './components/GeneratedDataPanel';
import SearchableSelect from './components/SearchableSelect';
import ImageField from './components/ImageField';
import { getBeautyShadeName, MAKEUP_SWATCH_PRESETS, normalizeHex, isValidHex } from './components/HexColorPicker';
import {
  DISCOUNT_ROLES,
  normalizeQuantityTiers,
  getDefaultQuantityTiers,
  validateRoleTiers,
  getTotalQuantityTiersCount
} from './utils/quantityTiersUtils';
import { getProductAttributeSuggestions } from './utils/attributeMasterData';

// Smart attribute placeholder helper for dynamic variant inputs
const getDynamicAttributePlaceholder = (attrName) => {
  const norm = (attrName || '').toLowerCase().trim();
  if (norm.includes('size')) return 'e.g. 50ml, 100ml, 200g';
  if (norm.includes('volume')) return 'e.g. 30ml, 50ml, 100ml';
  if (norm.includes('weight')) return 'e.g. 50g, 100g';
  if (norm.includes('formula') || norm.includes('formulation')) return 'e.g. Gel, Cream, Serum, Lotion';
  if (norm.includes('skin')) return 'e.g. Oily, Dry, Combination, Sensitive';
  if (norm.includes('hair')) return 'e.g. Curly, Straight, Wavy, Frizzy';
  if (norm.includes('shade') || norm.includes('colour') || norm.includes('color')) return 'e.g. Velvet Rose, Natural Buff, Ruby';
  if (norm.includes('finish')) return 'e.g. Matte, Dewy, Satin, Glossy';
  if (norm.includes('coverage')) return 'e.g. Full Coverage, Medium, Sheer';
  if (norm.includes('pack')) return 'e.g. Single, Pack of 2, Duo Set';
  if (norm.includes('fragrance') || norm.includes('scent')) return 'e.g. Lavender, Rose, Jasmine';
  return `Enter ${attrName}`;
};

const AdminDashboard = () => {
  const {
    brands,
    products,
    categories,
    orders,
    users,
    b2bVerifications = [],
    abandonedCarts = [],
    searchRequests = [],
    searchRequestsLoading = false,
    refreshSearchRequests,
    updateSearchRequestStatus,
    deleteSearchRequest,
    cancelFeeSettings,
    cancelledOrdersLog,
    toggleBrandStatus,
    addBrand,
    updateBrand,
    addProduct,
    updateProduct,
    deleteProduct,
    deleteProductVariant,
    updateOrderStatus,
    updateOrderItemStatus,
    updateProductRolePrices,
    toggleUserVerification,
    updateCancelFeeSettings,
    toggleFeeWaived,
    homeSectionVisibility,
    toggleHomeSectionVisibility,
    resetHomeSectionVisibility,
    recommendationConfig,
    updateRecommendationConfig,
    resetRecommendationConfig,
    updateCategoriesOrder,
    toggleCategoryStatus,
    addCategory,
    updateCategory,
    deleteCategory,
    checkBarcodeInSupabase,
    searchProductByBarcode,
    uploadProductImage,
    updateProductShades,
    updateProductQuantityTiers,
    pricingRules,
    updatePricingRules,
    DEFAULT_PRICING_RULES,
    isLoading = false,
    fetchError = null,
    refreshData,
    employees = [],
    employeeActivityLogs = [],
    employeeOperations = [],
    currentAuthUser,
    loginUser,
    logoutUser,
    homeBanners = [],
    saveHomeBanners,
    addHomeBanner,
    updateHomeBanner,
    deleteHomeBanner,
    toggleHomeBannerActive,
    reorderHomeBanners,
    DEFAULT_HOME_BANNERS = [],
  } = useAdmin();

  const [loginLoading, setLoginLoading] = useState(false);
  const [prefilledProductName, setPrefilledProductName] = useState('');
  const [loginError, setLoginError] = useState(null);

  const [dashboardToast, setDashboardToast] = useState(null);

  useEffect(() => {
    if (dashboardToast) {
      const timer = setTimeout(() => setDashboardToast(null), 3500);
      return () => clearTimeout(timer);
    }
  }, [dashboardToast]);

  const [isAuthenticated, setIsAuthenticated] = useState(true);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [loginCredentials, setLoginCredentials] = useState({ email: 'admin@salbeau.com', password: '••••••••' });

  const [activeTab, setActiveTab] = useState(() => {
    if (typeof window !== 'undefined') {
      const pathname = window.location.pathname.toLowerCase();
      const hash = window.location.hash.toLowerCase().replace(/^#\/?/, '');
      const matchPath = pathname.match(/\/admin\/(.+)/);
      const routeParam = matchPath ? matchPath[1].replace(/\/$/, '') : hash;
      const validTabs = [
        'dashboard',
        'dashboard_visibility',
        'home_banners',
        'categories',
        'order_updated',
        'add_brand',
        'products',
        'products/new',
        'products/bulk',
        'attributes',
        'user',
        'users',
        'users/b2c',
        'users/b2b',
        'user/b2c',
        'user/b2b',
        'b2b_verification',
        'b2b-verification',
        'b2b-verification/salon',
        'b2b_verification/salon',
        'b2b-verification/makeup-artist',
        'b2b_verification/makeup-artist',
        'b2b_verification/makeup_artist',
        'b2b-verification/beautician',
        'b2b_verification/beautician',
        'cancel_fee',
        'pricing_rules',
        'abandoned_carts',
        'search_requests',
        'approval_center',
        'audit_trail',
        'employees',
        'employees/new',
        'employees/activity',
        'quick_panel',
        'settings'
      ];
      if (routeParam === 'categories_order') {
        return 'categories';
      }
      if (routeParam === 'settings') {
        return 'dashboard_visibility';
      }
      if (routeParam && (
        validTabs.includes(routeParam) ||
        routeParam.startsWith('employees/') ||
        routeParam.startsWith('b2b') ||
        routeParam.startsWith('user')
      )) {
        return routeParam;
      }
    }
    return 'dashboard';
  });

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('salbeau_sidebar_collapsed');
      if (saved !== null) {
        return saved === 'true';
      }
      return window.innerWidth < 1024;
    }
    return false;
  });

  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
  const [hoveredTooltip, setHoveredTooltip] = useState(null);

  const toggleSidebar = () => {
    setIsSidebarCollapsed((prev) => {
      const next = !prev;
      if (typeof window !== 'undefined') {
        localStorage.setItem('salbeau_sidebar_collapsed', String(next));
      }
      return next;
    });
  };

  const setSidebarCollapsedState = (collapsed) => {
    setIsSidebarCollapsed(collapsed);
    if (typeof window !== 'undefined') {
      localStorage.setItem('salbeau_sidebar_collapsed', String(collapsed));
    }
  };

  const navigateToTab = (tabId) => {
    setActiveTab(tabId);
    if (typeof window !== 'undefined' && window.history && window.history.pushState) {
      window.history.pushState({ tab: tabId }, '', `/admin/${tabId}`);
    }
  };

  useEffect(() => {
    const handlePopState = () => {
      if (typeof window !== 'undefined') {
        const pathname = window.location.pathname.toLowerCase();
        const matchPath = pathname.match(/\/admin\/(.+)/);
        const routeParam = matchPath ? matchPath[1].replace(/\/$/, '') : window.location.hash.replace(/^#\/?/, '');
        const validTabs = [
          'dashboard',
          'dashboard_visibility',
          'home_banners',
          'categories',
          'order_updated',
          'add_brand',
          'products',
          'products/new',
          'products/bulk',
          'attributes',
          'user',
          'users',
          'users/b2c',
          'users/b2b',
          'user/b2c',
          'user/b2b',
          'b2b_verification',
          'b2b-verification',
          'b2b-verification/salon',
          'b2b_verification/salon',
          'b2b-verification/makeup-artist',
          'b2b_verification/makeup-artist',
          'b2b_verification/makeup_artist',
          'b2b-verification/beautician',
          'b2b_verification/beautician',
          'cancel_fee',
          'pricing_rules',
          'abandoned_carts',
          'search_requests',
          'approval_center',
          'audit_trail',
          'employees',
          'employees/new',
          'employees/activity',
          'quick_panel',
          'settings'
        ];
        if (routeParam === 'categories_order') {
          setActiveTab('categories');
          return;
        }
        if (routeParam === 'settings') {
          setActiveTab('dashboard_visibility');
          return;
        }
        if (routeParam && (
          validTabs.includes(routeParam) ||
          routeParam.startsWith('employees/') ||
          routeParam.startsWith('b2b') ||
          routeParam.startsWith('user')
        )) {
          setActiveTab(routeParam);
        }
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        setIsSidebarCollapsed(true);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleTooltipEnter = (e, label, badge) => {
    if (!isSidebarCollapsed) return;
    const rect = e.currentTarget.getBoundingClientRect();
    setHoveredTooltip({
      label,
      badge,
      top: rect.top + rect.height / 2,
      left: rect.right + 10,
    });
  };

  const handleTooltipLeave = () => {
    setHoveredTooltip(null);
  };

  const [openSubmenus, setOpenSubmenus] = useState({
    users: true,
    b2b_verification: true,
    employees: false
  });

  const b2bPendingTotal = useMemo(() => {
    return (b2bVerifications || []).filter(v => ['submitted', 'under_review'].includes((v.verification_status || '').toLowerCase())).length;
  }, [b2bVerifications]);

  const b2bPendingSalon = useMemo(() => {
    return (b2bVerifications || []).filter(v => (v.role || '').toLowerCase() === 'salon' && ['submitted', 'under_review'].includes((v.verification_status || '').toLowerCase())).length;
  }, [b2bVerifications]);

  const b2bPendingArtist = useMemo(() => {
    return (b2bVerifications || []).filter(v => (v.role || '').toLowerCase() === 'artist' && ['submitted', 'under_review'].includes((v.verification_status || '').toLowerCase())).length;
  }, [b2bVerifications]);

  const b2bPendingBeautician = useMemo(() => {
    return (b2bVerifications || []).filter(v => (v.role || '').toLowerCase() === 'beautician' && ['submitted', 'under_review'].includes((v.verification_status || '').toLowerCase())).length;
  }, [b2bVerifications]);

  const b2cUsersCount = useMemo(() => {
    return (users || []).filter(u => !['salon', 'artist', 'beautician'].includes((u.role || '').toLowerCase())).length;
  }, [users]);

  const b2bUsersCount = useMemo(() => {
    return (users || []).filter(u => ['salon', 'artist', 'beautician'].includes((u.role || '').toLowerCase())).length;
  }, [users]);

  const isItemActive = useCallback((itemId) => {
    if (!itemId) return false;
    if (itemId === 'dashboard') return activeTab === 'dashboard';
    if (itemId === 'dashboard_visibility') return activeTab === 'dashboard_visibility';
    if (itemId === 'products') return activeTab === 'products' || activeTab === 'products/new';
    if (itemId === 'products/bulk') return activeTab === 'products/bulk';
    if (itemId === 'users') return activeTab === 'user' || activeTab.startsWith('users') || activeTab.startsWith('user/');
    if (itemId === 'users/b2c') return activeTab === 'users/b2c' || activeTab === 'user/b2c' || activeTab === 'user' || activeTab === 'users';
    if (itemId === 'users/b2b') return activeTab === 'users/b2b' || activeTab === 'user/b2b';
    if (itemId === 'b2b-verification') return activeTab === 'b2b-verification' || activeTab === 'b2b_verification';
    if (itemId === 'b2b-verification/salon') return activeTab === 'b2b-verification/salon' || activeTab === 'b2b_verification/salon';
    if (itemId === 'b2b-verification/makeup-artist') return activeTab === 'b2b-verification/makeup-artist' || activeTab === 'b2b_verification/makeup-artist' || activeTab === 'b2b_verification/makeup_artist';
    if (itemId === 'b2b-verification/beautician') return activeTab === 'b2b-verification/beautician' || activeTab === 'b2b_verification/beautician';
    if (itemId === 'employees') return activeTab === 'employees' || activeTab === 'employees/new';
    if (itemId === 'employees/activity') return activeTab === 'employees/activity';
    return activeTab === itemId;
  }, [activeTab]);

  const navSections = useMemo(() => [
    {
      title: 'MAIN',
      items: [
        {
          id: 'dashboard',
          label: 'Dashboard',
          icon: LayoutGrid,
        },
        {
          id: 'dashboard_visibility',
          label: 'Dashboard Visibility',
          icon: Eye,
        },
      ]
    },
    {
      title: 'CONTENT & STORE',
      items: [
        {
          id: 'home_banners',
          label: 'Home Banners',
          icon: ImageIcon,
          badge: homeBanners ? `${homeBanners.filter(b => b.isActive !== false).length} Active` : '5 Active',
          badgeClass: 'bg-[#FFF5F8] text-[#C2477A] font-bold border border-[#FCE4EC] px-1.5 py-0.5 text-[9.5px] rounded-full',
          isPillBadge: true,
        },
        {
          id: 'categories',
          label: 'Categories',
          icon: FolderPlus,
          badge: categories?.length || 0,
          badgeClass: 'bg-emerald-100 text-emerald-700 font-bold px-2 py-0.5 text-[10px] rounded-full',
        },
        {
          id: 'add_brand',
          label: 'Add Brand',
          icon: BadgePlus,
        },
      ]
    },
    {
      title: 'PRODUCTS',
      items: [
        {
          id: 'products',
          label: 'Products',
          icon: Package,
        },
        {
          id: 'products/bulk',
          label: 'Bulk Product Entry',
          icon: Table,
          badge: 'Fast',
          badgeClass: 'bg-indigo-100 text-indigo-700 font-extrabold text-[9.5px]',
          isPillBadge: true,
        },
        {
          id: 'attributes',
          label: 'Attributes Master',
          icon: Sparkles,
        },
      ]
    },
    {
      title: 'ORDERS & APPROVALS',
      items: [
        {
          id: 'order_updated',
          label: 'Order Updated',
          icon: ShoppingBag,
        },
        {
          id: 'approval_center',
          label: 'Approval Center',
          icon: ShieldCheck,
          badge: (employeeOperations || []).filter(op => op.status === 'pending').length || null,
          badgeClass: 'min-w-[20px] h-5 px-1.5 bg-amber-500 text-white text-[10px] font-black rounded-full flex items-center justify-center shadow-xs',
          isPillBadge: true,
        },
      ]
    },
    {
      title: 'CUSTOMERS',
      items: [
        {
          id: 'users',
          label: 'Users',
          icon: Users,
          badge: users?.length > 0 ? String(users.length) : null,
          badgeClass: 'min-w-[20px] h-5 px-1.5 bg-[#C2477A] text-white text-[10px] font-bold rounded-full flex items-center justify-center',
          isPillBadge: true,
          subItems: [
            {
              id: 'users/b2c',
              label: 'B2C Users',
              icon: User,
              badge: b2cUsersCount > 0 ? String(b2cUsersCount) : null,
              badgeClass: 'bg-pink-100 text-[#C2477A] font-bold text-[9.5px] px-1.5 py-0.2 rounded-full'
            },
            {
              id: 'users/b2b',
              label: 'B2B Users',
              icon: Building2,
              badge: b2bUsersCount > 0 ? String(b2bUsersCount) : null,
              badgeClass: 'bg-purple-100 text-purple-700 font-bold text-[9.5px] px-1.5 py-0.2 rounded-full'
            }
          ]
        },
        {
          id: 'search_requests',
          label: 'Customer Search Activity',
          icon: Search,
          badge: (searchRequests || []).filter(r => !r.status || r.status === 'pending').length || null,
          badgeClass: 'min-w-[20px] h-5 px-1.5 bg-[#C2477A] text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow-xs',
          isPillBadge: true,
        },
        {
          id: 'abandoned_carts',
          label: 'Abandoned Carts',
          icon: ShoppingCart,
          badge: (abandonedCarts || []).filter(c => c.status === 'abandoned').length || null,
          badgeClass: 'px-2 py-0.5 bg-amber-500 text-white text-[10px] font-black rounded-full flex items-center justify-center shadow-xs',
          isPillBadge: true,
        },
      ]
    },
    {
      title: 'B2B VERIFICATION',
      items: [
        {
          id: 'b2b-verification',
          label: 'All Applications',
          icon: ShieldCheck,
          badge: b2bPendingTotal > 0 ? String(b2bPendingTotal) : null,
          badgeClass: 'px-2 py-0.5 bg-amber-500 text-white text-[10px] font-black rounded-full flex items-center justify-center shadow-xs',
          isPillBadge: true,
        },
        {
          id: 'b2b-verification/salon',
          label: 'Salon Verification',
          icon: Store,
          badge: b2bPendingSalon > 0 ? String(b2bPendingSalon) : null,
          badgeClass: 'px-2 py-0.5 bg-amber-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow-xs',
          isPillBadge: true,
        },
        {
          id: 'b2b-verification/makeup-artist',
          label: 'Makeup Artist Verification',
          icon: Sparkles,
          badge: b2bPendingArtist > 0 ? String(b2bPendingArtist) : null,
          badgeClass: 'px-2 py-0.5 bg-amber-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow-xs',
          isPillBadge: true,
        },
        {
          id: 'b2b-verification/beautician',
          label: 'Beautician Verification',
          icon: Award,
          badge: b2bPendingBeautician > 0 ? String(b2bPendingBeautician) : null,
          badgeClass: 'px-2 py-0.5 bg-amber-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow-xs',
          isPillBadge: true,
        },
      ]
    },
    {
      title: 'PRICING',
      items: [
        {
          id: 'cancel_fee',
          label: 'Cancel Fee',
          icon: DollarSign,
        },
        {
          id: 'pricing_rules',
          label: 'Pricing Rules',
          icon: Percent,
        },
      ]
    },
    {
      title: 'TEAM & SECURITY',
      items: [
        {
          id: 'employees',
          label: 'Employees',
          icon: Users,
          badge: (employees || []).filter(e => e.status === 'active').length || null,
          badgeClass: 'px-2 py-0.5 bg-[#C2477A] text-white text-[10px] font-bold rounded-full flex items-center justify-center',
          isPillBadge: true,
          subItems: [
            { id: 'employees', label: 'All Employees' },
            { id: 'employees/activity', label: 'Employee Activity' }
          ]
        },
        {
          id: 'audit_trail',
          label: 'Audit Trail',
          icon: FileText,
        },
      ]
    },
    {
      title: 'QUICK ACCESS',
      items: [
        {
          id: 'quick_panel',
          label: 'Quick Panel',
          icon: LayoutGrid,
        },
      ]
    },
    {
      title: 'SYSTEM',
      items: [
        {
          id: 'dashboard_visibility',
          label: 'Settings',
          icon: Eye,
        },
        {
          id: 'logout',
          label: 'Log Out',
          icon: LogOut,
          isAction: true,
        },
      ]
    }
  ], [
    homeBanners,
    categories,
    employeeOperations,
    users,
    b2cUsersCount,
    b2bUsersCount,
    searchRequests,
    abandonedCarts,
    b2bPendingTotal,
    b2bPendingSalon,
    b2bPendingArtist,
    b2bPendingBeautician,
    employees
  ]);

  // Dynamic Sidebar Navigation Filtering based on Role and Permissions
  const filteredNavSections = useMemo(() => {
    if (!currentAuthUser || currentAuthUser.role === 'admin') {
      return navSections;
    }
    const perms = currentAuthUser.permissions || {};
    return navSections.map(sec => {
      const filteredItems = sec.items.filter(item => {
        if (item.id === 'dashboard') return perms.dashboard?.enabled !== false;
        if (item.id === 'dashboard_visibility' || item.id === 'settings') return hasModuleAccess(perms, 'settings');
        if (item.id === 'home_banners') return hasModuleAccess(perms, 'settings') || currentAuthUser?.role === 'admin';
        if (item.id === 'categories') return hasModuleAccess(perms, 'categories');
        if (item.id === 'add_brand') return hasModuleAccess(perms, 'brands');
        if (item.id === 'products' || item.id === 'attributes' || item.id === 'products/bulk') return hasModuleAccess(perms, 'products');
        if (item.id === 'order_updated') return hasModuleAccess(perms, 'orders');
        if (item.id === 'approval_center') return currentAuthUser?.role === 'admin' || hasModuleAccess(perms, 'approvals');
        if (item.id === 'users' || item.id === 'user') return hasModuleAccess(perms, 'customers');
        if (item.id === 'search_requests') return hasModuleAccess(perms, 'products') || hasModuleAccess(perms, 'customers');
        if (item.id === 'abandoned_carts') return hasModuleAccess(perms, 'orders');
        if (item.id.startsWith('b2b')) return currentAuthUser?.role === 'admin' || hasModuleAccess(perms, 'customers') || hasModuleAccess(perms, 'approvals');
        if (item.id === 'cancel_fee') return hasModuleAccess(perms, 'payments');
        if (item.id === 'pricing_rules') return hasModuleAccess(perms, 'offers');
        if (item.id === 'employees') return hasModuleAccess(perms, 'employees');
        if (item.id === 'audit_trail') return currentAuthUser?.role === 'admin' || hasModuleAccess(perms, 'employees');
        if (item.id === 'quick_panel') return true;
        if (item.id === 'logout') return true;
        return false;
      });
      return { ...sec, items: filteredItems };
    }).filter(sec => sec.items.length > 0);
  }, [navSections, currentAuthUser]);

  const filteredNavItems = useMemo(() => {
    return filteredNavSections.flatMap(sec => sec.items);
  }, [filteredNavSections]);

  const navItems = filteredNavItems;

  const allNavItemsFlat = useMemo(() => {
    return filteredNavSections.flatMap(sec =>
      sec.items.flatMap(item => [item, ...(item.subItems || [])])
    );
  }, [filteredNavSections]);

  const getActiveTabLabel = useCallback((tab) => {
    if (!tab) return 'Admin';
    if (tab === 'products/new') return 'Add Product';
    if (tab === 'products/bulk') return 'Bulk Product Entry';
    if (tab === 'users/b2c' || tab === 'user/b2c') return 'B2C Users';
    if (tab === 'users/b2b' || tab === 'user/b2b') return 'B2B Users';
    if (tab === 'b2b-verification') return 'All Applications';
    if (tab === 'b2b-verification/salon') return 'Salon Verification';
    if (tab === 'b2b-verification/makeup-artist' || tab === 'b2b-verification/makeup_artist') return 'Makeup Artist';
    if (tab === 'b2b-verification/beautician') return 'Beautician';
    if (tab === 'quick_panel') return 'Quick Panel';
    if (tab.startsWith('employees')) return 'Employees';
    const match = allNavItemsFlat.find(i => i.id === tab);
    return match?.label || 'Admin';
  }, [allNavItemsFlat]);

  // Table Drag-and-Drop & Sequence States
  const [draggedTableCatIndex, setDraggedTableCatIndex] = useState(null);
  const [dragOverTableCatIndex, setDragOverTableCatIndex] = useState(null);
  const [isSavingCategoryOrder, setIsSavingCategoryOrder] = useState(false);

  const handleTableDragStart = (e, index) => {
    setDraggedTableCatIndex(index);
    if (e.dataTransfer) {
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', String(index));
    }
  };

  const handleTableDragOver = (e, index) => {
    e.preventDefault();
    if (e.dataTransfer) {
      e.dataTransfer.dropEffect = 'move';
    }
    if (dragOverTableCatIndex !== index) {
      setDragOverTableCatIndex(index);
    }
  };

  const handleTableDrop = async (e, targetIndex) => {
    e.preventDefault();
    if (draggedTableCatIndex === null || draggedTableCatIndex === targetIndex) {
      setDraggedTableCatIndex(null);
      setDragOverTableCatIndex(null);
      return;
    }

    const currentList = [...(categories || [])];
    const sourceCat = paginatedCategories[draggedTableCatIndex];
    const targetCat = paginatedCategories[targetIndex];

    if (!sourceCat || !targetCat) {
      setDraggedTableCatIndex(null);
      setDragOverTableCatIndex(null);
      return;
    }

    const fromIdx = currentList.findIndex((c) => c.id === sourceCat.id);
    const toIdx = currentList.findIndex((c) => c.id === targetCat.id);

    if (fromIdx === -1 || toIdx === -1) {
      setDraggedTableCatIndex(null);
      setDragOverTableCatIndex(null);
      return;
    }

    const [moved] = currentList.splice(fromIdx, 1);
    currentList.splice(toIdx, 0, moved);

    const updated = currentList.map((item, idx) => ({ ...item, sort_order: idx + 1 }));
    setDraggedTableCatIndex(null);
    setDragOverTableCatIndex(null);

    try {
      await updateCategoriesOrder(updated);
      setCategoryNotice({
        type: 'success',
        message: `Order updated! "${moved.name}" moved to position #${toIdx + 1} and synced to Customer App.`
      });
      setTimeout(() => setCategoryNotice(null), 3000);
    } catch (err) {
      setCategoryNotice({ type: 'error', message: 'Failed to update category order in Supabase.' });
      setTimeout(() => setCategoryNotice(null), 4000);
    }
  };

  const handleTableDragEnd = () => {
    setDraggedTableCatIndex(null);
    setDragOverTableCatIndex(null);
  };

  const handleMoveCategoryPosition = async (catId, direction) => {
    const list = [...(categories || [])];
    const currentIndex = list.findIndex((c) => c.id === catId);
    if (currentIndex === -1) return;
    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (targetIndex < 0 || targetIndex >= list.length) return;

    const temp = list[currentIndex];
    list[currentIndex] = list[targetIndex];
    list[targetIndex] = temp;

    const updated = list.map((item, idx) => ({ ...item, sort_order: idx + 1 }));
    try {
      await updateCategoriesOrder(updated);
      setCategoryNotice({
        type: 'success',
        message: `Moved "${temp.name}" ${direction === 'up' ? 'up' : 'down'} to position #${targetIndex + 1}! Live on Customer App.`
      });
      setTimeout(() => setCategoryNotice(null), 2500);
    } catch (err) {
      setCategoryNotice({ type: 'error', message: 'Failed to update position: ' + (err.message || err) });
      setTimeout(() => setCategoryNotice(null), 4000);
    }
  };

  const handleSaveCategoryOrder = async () => {
    setIsSavingCategoryOrder(true);
    try {
      const updated = (categories || []).map((cat, idx) => ({ ...cat, sort_order: idx + 1 }));
      await updateCategoriesOrder(updated);
      setCategoryNotice({
        type: 'success',
        message: 'Category order sequence successfully saved to Supabase and live on Customer App!'
      });
      setTimeout(() => setCategoryNotice(null), 3500);
    } catch (err) {
      setCategoryNotice({ type: 'error', message: 'Failed to save category order: ' + (err.message || err) });
      setTimeout(() => setCategoryNotice(null), 4000);
    } finally {
      setIsSavingCategoryOrder(false);
    }
  };

  const [selectedBranch, setSelectedBranch] = useState('All Branches');

  // Form states for Category Items
  const [isAddCategoryModalOpen, setIsAddCategoryModalOpen] = useState(false);
  const [newCategory, setNewCategory] = useState({
    name: '',
    enabled: true
  });
  const [showCategorySuccess, setShowCategorySuccess] = useState(false);
  const [categoryNotice, setCategoryNotice] = useState(null);
  const [editingCategory, setEditingCategory] = useState(null);
  const [isEditCategoryModalOpen, setIsEditCategoryModalOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState(null);
  const [isDeleteCategoryModalOpen, setIsDeleteCategoryModalOpen] = useState(false);
  const [isDeletingCategory, setIsDeletingCategory] = useState(false);

  // Home Banner Management States
  const [isAddBannerModalOpen, setIsAddBannerModalOpen] = useState(false);
  const [isEditBannerModalOpen, setIsEditBannerModalOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState(null);
  const [bannerToDelete, setBannerToDelete] = useState(null);
  const [isDeleteBannerModalOpen, setIsDeleteBannerModalOpen] = useState(false);
  const [bannerNotice, setBannerNotice] = useState(null);
  const [bannerFormData, setBannerFormData] = useState({
    theme: '',
    title: '',
    subtitle: '',
    ctaText: '',
    destinationType: 'CATEGORY',
    destinationId: '',
    imageUrl: '',
    isActive: true,
  });

  const handleOpenAddBanner = () => {
    setBannerFormData({
      theme: 'Beauty Essentials',
      title: '',
      subtitle: '',
      ctaText: 'Shop Now →',
      destinationType: 'CATEGORY',
      destinationId: categories[0]?.name || 'Makeup',
      imageUrl: '',
      isActive: true,
    });
    setIsAddBannerModalOpen(true);
  };

  const handleOpenEditBanner = (banner) => {
    setEditingBanner(banner);
    setBannerFormData({
      theme: banner.theme || banner.badge || '',
      title: banner.title || '',
      subtitle: banner.subtitle || '',
      ctaText: banner.ctaText || banner.ctaLabel || 'Shop Now →',
      destinationType: banner.destinationType || 'CATEGORY',
      destinationId: banner.destinationId || '',
      imageUrl: banner.imageUrl || '',
      isActive: banner.isActive !== false,
    });
    setIsEditBannerModalOpen(true);
  };

  const handleSaveAddBanner = async (e) => {
    e.preventDefault();
    if (!bannerFormData.title.trim() || !bannerFormData.imageUrl.trim()) {
      alert('Banner Title and Image URL are required.');
      return;
    }
    try {
      await addHomeBanner({
        badge: bannerFormData.theme,
        theme: bannerFormData.theme,
        title: bannerFormData.title,
        subtitle: bannerFormData.subtitle,
        ctaText: bannerFormData.ctaText,
        ctaLabel: bannerFormData.ctaText,
        destinationType: bannerFormData.destinationType,
        destinationId: bannerFormData.destinationId,
        imageUrl: bannerFormData.imageUrl,
        isActive: bannerFormData.isActive,
      });
      setIsAddBannerModalOpen(false);
      setBannerNotice({ type: 'success', message: 'Banner added successfully and live on Mobile App!' });
      setTimeout(() => setBannerNotice(null), 3000);
    } catch (err) {
      setBannerNotice({ type: 'error', message: 'Failed to add banner: ' + err.message });
      setTimeout(() => setBannerNotice(null), 4000);
    }
  };

  const handleSaveEditBanner = async (e) => {
    e.preventDefault();
    if (!editingBanner) return;
    try {
      await updateHomeBanner(editingBanner.id, {
        badge: bannerFormData.theme,
        theme: bannerFormData.theme,
        title: bannerFormData.title,
        subtitle: bannerFormData.subtitle,
        ctaText: bannerFormData.ctaText,
        ctaLabel: bannerFormData.ctaText,
        destinationType: bannerFormData.destinationType,
        destinationId: bannerFormData.destinationId,
        imageUrl: bannerFormData.imageUrl,
        isActive: bannerFormData.isActive,
      });
      setIsEditBannerModalOpen(false);
      setEditingBanner(null);
      setBannerNotice({ type: 'success', message: 'Banner updated and live on Mobile App!' });
      setTimeout(() => setBannerNotice(null), 3000);
    } catch (err) {
      setBannerNotice({ type: 'error', message: 'Failed to update banner: ' + err.message });
      setTimeout(() => setBannerNotice(null), 4000);
    }
  };

  const handleMoveBannerOrder = async (bannerId, direction) => {
    const list = [...(homeBanners || [])];
    const currentIndex = list.findIndex(b => b.id === bannerId);
    if (currentIndex === -1) return;
    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (targetIndex < 0 || targetIndex >= list.length) return;
    const temp = list[currentIndex];
    list[currentIndex] = list[targetIndex];
    list[targetIndex] = temp;
    await reorderHomeBanners(list.map(b => b.id));
  };

  // Category Excel Table states
  const [categorySearch, setCategorySearch] = useState('');
  const [categoryStatusFilter, setCategoryStatusFilter] = useState('all');
  const [categoryBrandFilter, setCategoryBrandFilter] = useState('all');
  const [categorySortColumn, setCategorySortColumn] = useState('position');
  const [categorySortDirection, setCategorySortDirection] = useState('asc');
  const [selectedCategoryIds, setSelectedCategoryIds] = useState([]);
  const [categoryPage, setCategoryPage] = useState(1);
  const [categoryPageSize, setCategoryPageSize] = useState(15);

  const handleCategorySort = (col) => {
    if (categorySortColumn === col) {
      setCategorySortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setCategorySortColumn(col);
      setCategorySortDirection('asc');
    }
  };

  const handleOpenEditCategory = (cat) => {
    setEditingCategory({
      id: cat.id,
      name: cat.name || '',
      enabled: cat.enabled !== false,
      sort_order: cat.sort_order || 0
    });
    setIsEditCategoryModalOpen(true);
  };

  const handleSaveEditCategory = async (e) => {
    e.preventDefault();
    if (!editingCategory || !editingCategory.name.trim()) return;
    try {
      await updateCategory(editingCategory.id, {
        name: editingCategory.name.trim(),
        enabled: editingCategory.enabled !== false
      });
      setIsEditCategoryModalOpen(false);
      setEditingCategory(null);
      setCategoryNotice({ type: 'success', message: 'Category Item updated successfully!' });
      setTimeout(() => setCategoryNotice(null), 3500);
    } catch (err) {
      setCategoryNotice({ type: 'error', message: 'Failed to update category: ' + (err.message || err) });
      setTimeout(() => setCategoryNotice(null), 4000);
    }
  };



  const handleBulkActivate = async () => {
    for (const id of selectedCategoryIds) {
      const cat = categories.find((c) => c.id === id);
      if (cat && cat.enabled === false) {
        await toggleCategoryStatus(id);
      }
    }
    setSelectedCategoryIds([]);
  };

  const handleBulkDeactivate = async () => {
    for (const id of selectedCategoryIds) {
      const cat = categories.find((c) => c.id === id);
      if (cat && cat.enabled !== false) {
        await toggleCategoryStatus(id);
      }
    }
    setSelectedCategoryIds([]);
  };

  const handleBulkDelete = async () => {
    if (confirm(`Are you sure you want to delete ${selectedCategoryIds.length} categories?`)) {
      for (const id of selectedCategoryIds) {
        await deleteCategory(id);
      }
      setSelectedCategoryIds([]);
    }
  };

  const formatCategoryDate = (dateStr) => {
    if (!dateStr) return '—';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return '—';
      return d.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      });
    } catch {
      return '—';
    }
  };

  // Filtered and Sorted Categories
  const filteredAndSortedCategories = React.useMemo(() => {
    let result = (categories || []).map((cat, index) => {
      const catProducts = (products || []).filter(
        (p) => p.category && p.category.toLowerCase() === (cat.name || '').toLowerCase()
      );
      const brandNames = Array.from(
        new Set([
          ...catProducts.map((p) => p.brandName).filter(Boolean),
          ...(brands || [])
            .filter((b) => b.category && b.category.toLowerCase() === (cat.name || '').toLowerCase() && b.name)
            .map((b) => b.name)
        ])
      );

      return {
        ...cat,
        originalIndex: index,
        position: Number(cat.sort_order ?? index + 1),
        productsCount: catProducts.length,
        brandNames: brandNames,
      };
    });

    if (categorySearch.trim()) {
      const q = categorySearch.toLowerCase().trim();
      result = result.filter(
        (c) =>
          (c.name && c.name.toLowerCase().includes(q)) ||
          (c.id && c.id.toLowerCase().includes(q)) ||
          c.brandNames.some((b) => b.toLowerCase().includes(q))
      );
    }

    if (categoryStatusFilter === 'active') {
      result = result.filter((c) => c.enabled !== false);
    } else if (categoryStatusFilter === 'inactive') {
      result = result.filter((c) => c.enabled === false);
    }

    if (categoryBrandFilter !== 'all') {
      result = result.filter((c) =>
        c.brandNames.some((b) => b.toLowerCase() === categoryBrandFilter.toLowerCase())
      );
    }

    result.sort((a, b) => {
      let comparison = 0;
      if (categorySortColumn === 'position') {
        comparison = (a.position || 0) - (b.position || 0);
      } else if (categorySortColumn === 'name') {
        comparison = (a.name || '').localeCompare(b.name || '');
      } else if (categorySortColumn === 'status') {
        comparison = (a.enabled === b.enabled) ? 0 : a.enabled ? -1 : 1;
      } else if (categorySortColumn === 'products') {
        comparison = (a.productsCount || 0) - (b.productsCount || 0);
      } else if (categorySortColumn === 'created_at') {
        const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
        const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
        comparison = dateA - dateB;
      }
      return categorySortDirection === 'asc' ? comparison : -comparison;
    });

    return result;
  }, [categories, products, brands, categorySearch, categoryStatusFilter, categoryBrandFilter, categorySortColumn, categorySortDirection]);

  const totalCategoryRecords = filteredAndSortedCategories.length;
  const totalCategoryPages = Math.max(1, Math.ceil(totalCategoryRecords / categoryPageSize));
  const currentCategoryPage = Math.min(categoryPage, totalCategoryPages);
  const paginatedCategories = React.useMemo(() => {
    const start = (currentCategoryPage - 1) * categoryPageSize;
    return filteredAndSortedCategories.slice(start, start + categoryPageSize);
  }, [filteredAndSortedCategories, currentCategoryPage, categoryPageSize]);

  const uniqueCategoryBrands = React.useMemo(() => {
    const set = new Set();
    (products || []).forEach(p => {
      if (p.brandName) set.add(p.brandName);
    });
    (brands || []).forEach(b => {
      if (b.name) set.add(b.name);
    });
    return Array.from(set).sort();
  }, [products, brands]);

  const handleAddCategorySubmit = async (e) => {
    e.preventDefault();
    if (!newCategory.name.trim()) return;
    try {
      await addCategory({
        name: newCategory.name.trim(),
        enabled: newCategory.enabled !== false
      });
      setNewCategory({
        name: '',
        enabled: true
      });
      setIsAddCategoryModalOpen(false);
      setCategoryNotice({ type: 'success', message: 'Category Item created successfully in Supabase!' });
      setTimeout(() => setCategoryNotice(null), 3500);
    } catch (err) {
      setCategoryNotice({ type: 'error', message: 'Failed to create category: ' + (err.message || err) });
      setTimeout(() => setCategoryNotice(null), 4000);
    }
  };

  // Form states for Add Brand
  const [isAddBrandModalOpen, setIsAddBrandModalOpen] = useState(false);
  const [newBrand, setNewBrand] = useState({
    name: '',
    logo: '',
    category: 'Makeup',
    enabled: true
  });
  const [editingBrand, setEditingBrand] = useState(null);
  const [isEditBrandModalOpen, setIsEditBrandModalOpen] = useState(false);
  const [showBrandSuccess, setShowBrandSuccess] = useState(false);
  const [brandSearch, setBrandSearch] = useState('');
  const [brandRecordsPerPage, setBrandRecordsPerPage] = useState(15);
  const [brandCurrentPage, setBrandCurrentPage] = useState(1);

  // Pagination & Search state for Products
  const [productSearch, setProductSearch] = useState('');
  const [catalogViewMode, setCatalogViewMode] = useState('all'); // 'all' (Product Families & Standalones) | 'variants' (Include Individual Child Variants)
  const [expandedProductIds, setExpandedProductIds] = useState(new Set());
  const toggleExpandProduct = (productId) => {
    setExpandedProductIds(prev => {
      const next = new Set(prev);
      if (next.has(productId)) next.delete(productId);
      else next.add(productId);
      return next;
    });
  };
  const [productRecordsPerPage, setProductRecordsPerPage] = useState(15);
  const [productCurrentPage, setProductCurrentPage] = useState(1);
  const [productBrandFilter, setProductBrandFilter] = useState('all');
  const [productCategoryFilter, setProductCategoryFilter] = useState('all');
  const [isCatalogScannerOpen, setIsCatalogScannerOpen] = useState(false);
  const [productNotFoundModal, setProductNotFoundModal] = useState({
    isOpen: false,
    barcode: '',
    format: ''
  });
  const [prefilledBarcodeForNewProduct, setPrefilledBarcodeForNewProduct] = useState({
    barcode: '',
    format: ''
  });
  // Barcode Search Result Modal state
  const [barcodeSearchResultModal, setBarcodeSearchResultModal] = useState({
    isOpen: false,
    barcode: '',
    barcodeFormat: 'Standard Barcode',
    searchResult: null,
    isSearching: false,
    searchError: null
  });

  // Form states for Products
  const [isAddProductModalOpen, setIsAddProductModalOpen] = useState(false);
  const [newProduct, setNewProduct] = useState({
    name: '',
    brandName: 'Lakmé',
    barcode: '',
    mrp: '',
    generalPrice: '',
    salonPrice: '',
    artistPrice: '',
    beauticianPrice: '',
    image: '',
    shades: [], // Array of { id, name, hexColor, priceOverride, active }
    quantityTiers: getDefaultQuantityTiers()
  });
  const [selectedImageFile, setSelectedImageFile] = useState(null);
  const [isUploadingProduct, setIsUploadingProduct] = useState(false);
  const [isDraggingImage, setIsDraggingImage] = useState(false);
  const [imageSearchError, setImageSearchError] = useState(null);
  const productImageInputRef = useRef(null);

  const [barcodeStatus, setBarcodeStatus] = useState({
    isChecking: false,
    exists: false,
    checkedBarcode: '',
    matchedProduct: null,
    barcodeType: '',
    error: null,
    formatError: null
  });
  const [isBarcodeScannerOpen, setIsBarcodeScannerOpen] = useState(false);
  const [activeBarcodeTarget, setActiveBarcodeTarget] = useState('add'); // 'add' | 'edit'

  // Full Edit Product Modal State
  const [isEditProductModalOpen, setIsEditProductModalOpen] = useState(false);
  const [editingProductData, setEditingProductData] = useState(null);
  const [editBarcodeStatus, setEditBarcodeStatus] = useState({
    isChecking: false,
    exists: false,
    checkedBarcode: '',
    matchedProduct: null,
    barcodeType: '',
    error: null,
    formatError: null
  });
  const [catalogSearchQuery, setCatalogSearchQuery] = useState('');
  const [showCatalogDropdown, setShowCatalogDropdown] = useState(false);
  const [showProductSuccess, setShowProductSuccess] = useState(false);
  const [editingProductId, setEditingProductId] = useState(null);
  const [editPrices, setEditPrices] = useState({ mrp: 0, generalPrice: 0, salonPrice: 0, artistPrice: 0, beauticianPrice: 0 });

  // Delete Product & Variant Confirmation Modal States
  const [productToDelete, setProductToDelete] = useState(null);
  const [isDeleteProductModalOpen, setIsDeleteProductModalOpen] = useState(false);
  const [deleteModeChoice, setDeleteModeChoice] = useState('full'); // 'full' | 'variant'
  const [selectedVariantToDelete, setSelectedVariantToDelete] = useState(null);
  const [isDeletingProduct, setIsDeletingProduct] = useState(false);

  // Role Discount Percentage States (Never auto-suggested or fixed; independently editable)
  const [newProductDiscounts, setNewProductDiscounts] = useState({
    salon: '',
    artist: '',
    beautician: ''
  });
  const [editProductDiscounts, setEditProductDiscounts] = useState({
    salon: '',
    artist: '',
    beautician: ''
  });

  const [prefilledHierarchyForNewProduct, setPrefilledHierarchyForNewProduct] = useState({
    category: '',
    subcategory: '',
    selectCategory: ''
  });

  const handleOpenAddProduct = () => {
    setPrefilledBarcodeForNewProduct({ barcode: '', format: '' });
    setPrefilledHierarchyForNewProduct({ category: '', subcategory: '', selectCategory: '' });
    navigateToTab('products/new');
  };

  const handleAddProductWithBarcode = (barcodeVal, formatVal = '') => {
    setProductNotFoundModal({ isOpen: false, barcode: '', format: '' });
    setPrefilledBarcodeForNewProduct({
      barcode: barcodeVal || '',
      format: formatVal || ''
    });
    navigateToTab('products/new');
  };

  const handleCatalogBarcodeScan = async (scannedCode, detectedFormat) => {
    setIsCatalogScannerOpen(false);
    const clean = (scannedCode || '').trim();
    if (!clean) return;

    const formatLabel = detectedFormat || 'Standard Barcode';

    // Open result modal immediately in loading state
    setBarcodeSearchResultModal({
      isOpen: true,
      barcode: clean,
      barcodeFormat: formatLabel,
      searchResult: null,
      isSearching: true,
      searchError: null
    });

    try {
      // Live Supabase lookup via searchProductByBarcode
      const result = searchProductByBarcode
        ? await searchProductByBarcode(clean)
        : null;

      setBarcodeSearchResultModal(prev => ({
        ...prev,
        isSearching: false,
        searchResult: result || { exists: false }
      }));

      // Also update the search box so the table is filtered
      setProductSearch(clean);
      setProductCurrentPage(1);
    } catch (err) {
      setBarcodeSearchResultModal(prev => ({
        ...prev,
        isSearching: false,
        searchError: err?.message || 'Failed to query the Supabase catalog. Check your connection and try again.'
      }));
    }
  };

  // Handler: view product by scrolling to its row in the catalog table
  const handleViewProductFromBarcode = (product) => {
    if (!product) return;
    setProductSearch(product.barcode || product.name || '');
    setProductCurrentPage(1);
    // Switch to Products tab if not already there
    setActiveTab('products');
  };

  // Handler: open edit modal for a scanned product
  const handleEditProductFromBarcode = (product) => {
    if (!product) return;
    // Find the full product in local state by id
    const local = products.find(p => p.id === product.id) || product;
    setEditingProduct(local);
    setIsEditModalOpen(true);
    setActiveTab('products');
  };

  // Hardware barcode scanner support on Products Catalog tab
  useHardwareBarcodeScanner({
    enabled: activeTab === 'products',
    onScan: (scannedCode) => {
      handleCatalogBarcodeScan(scannedCode, 'Hardware Scanner');
    }
  });

  const handleNewProductMrpChange = (val) => {
    setNewProduct(prev => {
      const base = Number(val);
      const updated = {
        ...prev,
        mrp: val,
        generalPrice: prev.generalPrice || val
      };
      if (!isNaN(base) && base > 0) {
        if (newProductDiscounts.salon !== '') {
          updated.salonPrice = Math.max(0, Math.round(base * (1 - Number(newProductDiscounts.salon) / 100)));
        }
        if (newProductDiscounts.artist !== '') {
          updated.artistPrice = Math.max(0, Math.round(base * (1 - Number(newProductDiscounts.artist) / 100)));
        }
        if (newProductDiscounts.beautician !== '') {
          updated.beauticianPrice = Math.max(0, Math.round(base * (1 - Number(newProductDiscounts.beautician) / 100)));
        }
      }
      return updated;
    });
  };

  const handleEditProductMrpChange = (val) => {
    setEditingProductData(prev => {
      if (!prev) return prev;
      const base = Number(val);
      const updated = {
        ...prev,
        mrp: val
      };
      if (!isNaN(base) && base > 0) {
        const getPrice = (pct) => {
          if (pct !== '' && pct !== null && pct !== undefined && !isNaN(Number(pct))) {
            return Math.max(0, Math.round(base * (1 - Number(pct) / 100)));
          }
          return base; // Default to base MRP (never 0!)
        };
        updated.generalPrice = getPrice(editProductDiscounts.general);
        updated.salonPrice = getPrice(editProductDiscounts.salon);
        updated.artistPrice = getPrice(editProductDiscounts.artist);
        updated.beauticianPrice = getPrice(editProductDiscounts.beautician);
      } else {
        updated.generalPrice = '';
        updated.salonPrice = '';
        updated.artistPrice = '';
        updated.beauticianPrice = '';
      }
      return updated;
    });
  };

  // Pricing Rules Admin Panel State
  const [draftPricingRules, setDraftPricingRules] = useState(null); // local draft copy of pricingRules for editing
  const [isSavingPricingRules, setIsSavingPricingRules] = useState(false);
  const [showPricingSuccess, setShowPricingSuccess] = useState(false);
  // Preview calculator state
  const [previewMrp, setPreviewMrp] = useState(500);
  const [previewQty, setPreviewQty] = useState(3);

  // Shade/Color Variant Management State (Catalog Matrix)
  const [shadeFormDraft, setShadeFormDraft] = useState({ name: '', hexColor: '#C2477A', priceOverride: '', active: true });
  // Dynamic Variant Management State for Edit Product Modal
  const [editProductActiveAttributes, setEditProductActiveAttributes] = useState([]);
  const [showAddVariantForm, setShowAddVariantForm] = useState(false);
  const [showCustomAttrInput, setShowCustomAttrInput] = useState(false);
  const [customAttributeInput, setCustomAttributeInput] = useState('');
  const [editVariantDraft, setEditVariantDraft] = useState({
    name: '',
    attributes: {},
    hexColor: '#C2477A',
    price: '',
    barcode: ''
  });
  const [editingShadeProductId, setEditingShadeProductId] = useState(null); // product whose shades panel is open
  const [editingRichDataProductId, setEditingRichDataProductId] = useState(null); // product whose discovery/rich-data panel is open
  const [productShadesLocal, setProductShadesLocal] = useState([]); // working copy of shades for the open product
  const [isSavingShades, setIsSavingShades] = useState(false);
  const [shadesSaveSuccess, setShadesSaveSuccess] = useState(false);

  // Shade Pricing & Quantity Tiers Modal State
  const [shadePricingModalConfig, setShadePricingModalConfig] = useState({
    isOpen: false,
    shade: null,
    parentProduct: null,
    target: null // 'new' | 'edit' | 'catalog'
  });

  const handleOpenShadePricing = (shade, parentProduct, target) => {
    setShadePricingModalConfig({
      isOpen: true,
      shade,
      parentProduct,
      target
    });
  };

  const handleSaveShadePricing = (updatedShade) => {
    if (shadePricingModalConfig.target === 'new') {
      setNewProduct(prev => ({
        ...prev,
        shades: (prev.shades || []).map(s => (s.id === updatedShade.id ? updatedShade : s))
      }));
    } else if (shadePricingModalConfig.target === 'edit') {
      setEditingProductData(prev => ({
        ...prev,
        shades: (prev.shades || []).map(s => (s.id === updatedShade.id ? updatedShade : s))
      }));
    } else if (shadePricingModalConfig.target === 'catalog') {
      const updatedList = productShadesLocal.map(s => (s.id === updatedShade.id ? updatedShade : s));
      setProductShadesLocal(updatedList);
      if (shadePricingModalConfig.parentProduct?.id) {
        updateProductShades(shadePricingModalConfig.parentProduct.id, updatedList);
      }
    }
    setShadePricingModalConfig({
      isOpen: false,
      shade: null,
      parentProduct: null,
      target: null
    });
  };

  const handleToggleProductShadesPanel = (product) => {
    if (editingShadeProductId === product.id) {
      setEditingShadeProductId(null);
      setProductShadesLocal([]);
      return;
    }
    setEditingShadeProductId(product.id);
    setProductShadesLocal(Array.isArray(product.shades) ? JSON.parse(JSON.stringify(product.shades)) : []);
    setShadesSaveSuccess(false);
  };

  const handleSaveProductShades = async (productId) => {
    setIsSavingShades(true);
    try {
      await updateProductShades(productId, productShadesLocal);
      setShadesSaveSuccess(true);
      setTimeout(() => {
        setShadesSaveSuccess(false);
        setEditingShadeProductId(null);
      }, 1200);
    } catch (e) {
      console.warn('Error saving product shades:', e);
      alert('Failed to save product shades.');
    } finally {
      setIsSavingShades(false);
    }
  };

  // Per-Product Quantity Discount Tiers Management State (Role-Separated)
  const [editingTiersProductId, setEditingTiersProductId] = useState(null); // product whose tiers panel is open
  const [productTiersLocal, setProductTiersLocal] = useState(getDefaultQuantityTiers()); // working copy of role tiers
  const [isSavingTiers, setIsSavingTiers] = useState(false);
  const [tiersSaveSuccess, setTiersSaveSuccess] = useState(false);

  // Lock body scroll when Add Product, Edit Product, Barcode Scanner, or Shade Pricing modal is open
  useEffect(() => {
    if (isAddProductModalOpen || isEditProductModalOpen || isBarcodeScannerOpen || shadePricingModalConfig.isOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isAddProductModalOpen, isEditProductModalOpen, isBarcodeScannerOpen, shadePricingModalConfig.isOpen]);

  // Real-time Barcode Validation against Supabase & Catalog for New Product
  useEffect(() => {
    const rawBarcode = (newProduct.barcode || '').trim();
    if (!rawBarcode) {
      setBarcodeStatus({
        isChecking: false,
        exists: false,
        checkedBarcode: '',
        matchedProduct: null,
        barcodeType: '',
        error: null,
        formatError: null
      });
      return;
    }

    // 1. Format validation
    const formatCheck = validateBarcodeFormat(rawBarcode);
    if (!formatCheck.isValid) {
      setBarcodeStatus({
        isChecking: false,
        exists: false,
        checkedBarcode: rawBarcode,
        matchedProduct: null,
        barcodeType: '',
        error: null,
        formatError: formatCheck.error
      });
      return;
    }

    setBarcodeStatus(prev => ({
      ...prev,
      isChecking: true,
      checkedBarcode: rawBarcode,
      formatError: null
    }));

    const timer = setTimeout(async () => {
      try {
        const result = await checkBarcodeInSupabase(rawBarcode);
        setBarcodeStatus({
          isChecking: false,
          exists: !!result.exists,
          checkedBarcode: rawBarcode,
          matchedProduct: result.product || null,
          barcodeType: formatCheck.barcodeType,
          error: null,
          formatError: null
        });
      } catch (err) {
        setBarcodeStatus({
          isChecking: false,
          exists: false,
          checkedBarcode: rawBarcode,
          matchedProduct: null,
          barcodeType: '',
          error: 'Verification failed',
          formatError: null
        });
      }
    }, 280);

    return () => clearTimeout(timer);
  }, [newProduct.barcode]);

  // Real-time Barcode Validation for Edit Product
  useEffect(() => {
    if (!editingProductData) return;
    const rawBarcode = (editingProductData.barcode || '').trim();
    if (!rawBarcode) {
      setEditBarcodeStatus({
        isChecking: false,
        exists: false,
        checkedBarcode: '',
        matchedProduct: null,
        barcodeType: '',
        error: null,
        formatError: null
      });
      return;
    }

    // 1. Format validation
    const formatCheck = validateBarcodeFormat(rawBarcode);
    if (!formatCheck.isValid) {
      setEditBarcodeStatus({
        isChecking: false,
        exists: false,
        checkedBarcode: rawBarcode,
        matchedProduct: null,
        barcodeType: '',
        error: null,
        formatError: formatCheck.error
      });
      return;
    }

    setEditBarcodeStatus(prev => ({
      ...prev,
      isChecking: true,
      checkedBarcode: rawBarcode,
      formatError: null
    }));

    const timer = setTimeout(async () => {
      try {
        const result = await checkBarcodeInSupabase(rawBarcode, editingProductData.id);
        setEditBarcodeStatus({
          isChecking: false,
          exists: !!result.exists,
          checkedBarcode: rawBarcode,
          matchedProduct: result.product || null,
          barcodeType: formatCheck.barcodeType,
          error: null,
          formatError: null
        });
      } catch (err) {
        setEditBarcodeStatus({
          isChecking: false,
          exists: false,
          checkedBarcode: rawBarcode,
          matchedProduct: null,
          barcodeType: '',
          error: 'Verification failed',
          formatError: null
        });
      }
    }, 280);

    return () => clearTimeout(timer);
  }, [editingProductData?.barcode, editingProductData?.id]);

  // Rejection Modal states
  const [isRejectionModalOpen, setIsRejectionModalOpen] = useState(false);
  const [rejectionTargetOrderId, setRejectionTargetOrderId] = useState(null);
  const [rejectionReasonText, setRejectionReasonText] = useState('Out of stock');
  const [customRejectionReason, setCustomRejectionReason] = useState('');

  // Order Acceptance Confirmation Modal states (Phase 7: Manual product availability confirmation without inventory constraints)
  const [isAcceptanceModalOpen, setIsAcceptanceModalOpen] = useState(false);
  const [acceptanceTargetOrder, setAcceptanceTargetOrder] = useState(null);
  const [itemsConfirmedAvailable, setItemsConfirmedAvailable] = useState(false);

  // Invoice Modal states
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [selectedInvoiceOrder, setSelectedInvoiceOrder] = useState(null);

  // Filter states
  const [userRoleFilter, setUserRoleFilter] = useState('all');
  const [b2bTypeFilter, setB2bTypeFilter] = useState('all');
  const [b2bVerificationStatusFilter, setB2bVerificationStatusFilter] = useState('all');
  const [orderStatusFilter, setOrderStatusFilter] = useState('all');
  const [userSearchTerm, setUserSearchTerm] = useState('');
  const [selectedUserDetails, setSelectedUserDetails] = useState(null);
  const [userRecordsPerPage, setUserRecordsPerPage] = useState(15);
  const [userCurrentPage, setUserCurrentPage] = useState(1);

  // Form states for Cancel Fee Settings
  const [feeForm, setFeeForm] = useState({ ...cancelFeeSettings });
  const [showFeeSuccess, setShowFeeSuccess] = useState(false);

  // Dynamic Branch Options loaded from database records
  const availableBranches = useMemo(() => {
    const set = new Set();
    (orders || []).forEach(o => {
      if (o.branch && typeof o.branch === 'string' && o.branch.trim()) {
        set.add(o.branch.trim());
      }
    });
    const sorted = Array.from(set).sort((a, b) => a.localeCompare(b));
    return ['All Branches', ...sorted];
  }, [orders]);

  // Branch-aware orders for Dashboard metrics
  const branchAwareOrders = useMemo(() => {
    if (!selectedBranch || selectedBranch === 'All Branches') return orders || [];
    return (orders || []).filter(o => o.branch && o.branch.toLowerCase().includes(selectedBranch.toLowerCase()));
  }, [orders, selectedBranch]);

  // 1. Valid orders (excludes rejected/invalid orders)
  const validOrders = useMemo(() => {
    return branchAwareOrders.filter(o => o.status !== 'rejected');
  }, [branchAwareOrders]);

  const totalOrdersCount = useMemo(() => {
    return validOrders.length.toLocaleString('en-IN');
  }, [validOrders]);

  // 2. Total Revenue (calculated from completed/payable orders, Indian currency format)
  const totalRevenueAmount = useMemo(() => {
    const rev = branchAwareOrders
      .filter(o => o.status !== 'cancelled' && o.status !== 'rejected')
      .reduce((sum, o) => {
        const amt = typeof o.totalAmount === 'number' ? o.totalAmount : parseFloat(o.totalAmount) || 0;
        return sum + (isNaN(amt) ? 0 : amt);
      }, 0);

    return '₹' + rev.toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  }, [branchAwareOrders]);

  // 3. Active Brand Ratio = (active/visible/enabled brands ÷ total brands) × 100
  const activeBrandsStats = useMemo(() => {
    const realBrands = (brands || []).filter(b =>
      b.id !== 'app_category_order_config' &&
      b.id !== 'app_brand_category_map' &&
      b.id !== 'app_home_section_visibility' &&
      b.id !== 'app_pricing_discount_config'
    );
    const total = realBrands.length;
    if (total === 0) {
      return { ratioString: '0%', enabledCount: 0, totalCount: 0 };
    }
    const enabledCount = realBrands.filter(b => b.enabled !== false).length;
    const pct = (enabledCount / total) * 100;
    return {
      ratioString: `${pct.toFixed(1)}%`,
      enabledCount,
      totalCount: total
    };
  }, [brands]);

  const activeBrandsRatio = activeBrandsStats.ratioString;

  // 4. Real Database KPI Comparisons (today vs yesterday, handles previous=0 safely)
  const kpiComparisons = useMemo(() => {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const startOfYesterday = startOfToday - 24 * 60 * 60 * 1000;

    const parseOrderDate = (o) => {
      const raw = o.date || o.placedAt || o.created_at;
      if (!raw) return null;
      const d = new Date(raw);
      return isNaN(d.getTime()) ? null : d;
    };

    let todayOrdersCount = 0;
    let yesterdayOrdersCount = 0;
    let todayRevenue = 0;
    let yesterdayRevenue = 0;

    validOrders.forEach(o => {
      const d = parseOrderDate(o);
      if (!d) return;
      const t = d.getTime();
      if (t >= startOfToday) {
        todayOrdersCount++;
      } else if (t >= startOfYesterday && t < startOfToday) {
        yesterdayOrdersCount++;
      }
    });

    branchAwareOrders
      .filter(o => o.status !== 'cancelled' && o.status !== 'rejected')
      .forEach(o => {
        const d = parseOrderDate(o);
        if (!d) return;
        const t = d.getTime();
        const amt = typeof o.totalAmount === 'number' ? o.totalAmount : parseFloat(o.totalAmount) || 0;
        if (t >= startOfToday) {
          todayRevenue += amt;
        } else if (t >= startOfYesterday && t < startOfToday) {
          yesterdayRevenue += amt;
        }
      });

    const calcComparison = (current, previous) => {
      if (previous === 0) {
        if (current === 0) {
          return { text: 'No change today', direction: 'neutral' };
        }
        return { text: `+${current} new today`, direction: 'up' };
      }
      const diff = ((current - previous) / previous) * 100;
      if (diff > 0) {
        return { text: `+${diff.toFixed(1)}% vs yesterday`, direction: 'up' };
      } else if (diff < 0) {
        return { text: `${diff.toFixed(1)}% vs yesterday`, direction: 'down' };
      }
      return { text: '0% vs yesterday', direction: 'neutral' };
    };

    return {
      orders: calcComparison(todayOrdersCount, yesterdayOrdersCount),
      revenue: calcComparison(todayRevenue, yesterdayRevenue),
      brands: {
        text: `${activeBrandsStats.enabledCount} of ${activeBrandsStats.totalCount} active`,
        direction: 'neutral'
      }
    };
  }, [validOrders, branchAwareOrders, activeBrandsStats]);

  const handleLogoFileUpload = (e, isEdit = false) => {
    const file = e.target.files && e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (isEdit) {
          setEditingBrand((prev) => ({ ...prev, logo: reader.result }));
        } else {
          setNewBrand((prev) => ({ ...prev, logo: reader.result }));
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleOpenAddBrand = () => {
    setNewBrand({
      name: '',
      logo: '',
      category: 'Makeup',
      enabled: true
    });
    setIsAddBrandModalOpen(true);
  };

  const handleOpenEditBrand = (brand) => {
    setEditingBrand({
      id: brand.id,
      name: brand.name || '',
      logo: brand.logo || '',
      category: brand.category || 'Makeup',
      enabled: brand.enabled !== false
    });
    setIsEditBrandModalOpen(true);
  };

  const handleAddBrandSubmit = (e) => {
    e.preventDefault();
    if (!newBrand.name.trim()) return;
    addBrand(newBrand);
    setNewBrand({
      name: '',
      logo: '',
      category: 'Makeup',
      enabled: true
    });
    setShowBrandSuccess(true);
    setIsAddBrandModalOpen(false);
    setTimeout(() => setShowBrandSuccess(false), 3000);
  };

  const handleEditBrandSubmit = async (e) => {
    e.preventDefault();
    if (!editingBrand || !editingBrand.name.trim()) return;
    await updateBrand(editingBrand.id, {
      name: editingBrand.name.trim(),
      logo: editingBrand.logo,
      category: editingBrand.category,
      enabled: editingBrand.enabled !== false
    });
    setIsEditBrandModalOpen(false);
    setEditingBrand(null);
    setShowBrandSuccess(true);
    setTimeout(() => setShowBrandSuccess(false), 3000);
  };

  const handleSearchGoogleImages = () => {
    const query = newProduct.name?.trim();
    if (!query) {
      setImageSearchError('Please enter a product name first.');
      return;
    }
    setImageSearchError(null);
    const searchUrl = `https://www.google.com/search?tbm=isch&q=${encodeURIComponent(query)}`;
    const win = window.open(searchUrl, '_blank', 'noopener,noreferrer');
    if (!win || win.closed || typeof win.closed === 'undefined') {
      setImageSearchError('Popup blocked! Please allow popups for this browser tab to open Google Image search in a new window.');
    }
  };

  const handleProductImageFileChange = (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setImageSearchError('Invalid file type. Please select a valid image file (PNG, JPG, WEBP, etc.).');
      return;
    }

    setImageSearchError(null);
    setSelectedImageFile(file);

    const reader = new FileReader();
    reader.onloadend = () => {
      setNewProduct(prev => ({ ...prev, image: reader.result }));
    };
    reader.readAsDataURL(file);
  };

  const handleImageDrop = async (e) => {
    e.preventDefault();
    setIsDraggingImage(false);
    setImageSearchError(null);

    // 1. Files dropped from disk/file manager
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      if (!file.type.startsWith('image/')) {
        setImageSearchError('Please drop an image file (PNG, JPG, WEBP).');
        return;
      }
      setSelectedImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewProduct(prev => ({ ...prev, image: reader.result }));
      };
      reader.readAsDataURL(file);
      return;
    }

    // 2. Image dragged directly from Google Images or another webpage
    const htmlData = e.dataTransfer.getData('text/html');
    const uriData = e.dataTransfer.getData('text/uri-list');
    const plainText = e.dataTransfer.getData('text/plain');

    let extractedUrl = '';
    if (htmlData) {
      const match = htmlData.match(/src\s*=\s*["']([^"']+)["']/i);
      if (match && match[1]) {
        extractedUrl = match[1];
      }
    }
    if (!extractedUrl && uriData) {
      extractedUrl = uriData.split('\n')[0].trim();
    }
    if (!extractedUrl && plainText && /^https?:\/\/.+/i.test(plainText.trim())) {
      extractedUrl = plainText.trim();
    }

    if (extractedUrl) {
      setNewProduct(prev => ({ ...prev, image: extractedUrl }));

      try {
        const response = await fetch(extractedUrl);
        if (response.ok) {
          const blob = await response.blob();
          const fileExt = (blob.type && blob.type.split('/')[1]) || 'jpg';
          const file = new File([blob], `product_${Date.now()}.${fileExt}`, { type: blob.type || 'image/jpeg' });
          setSelectedImageFile(file);
        } else {
          setSelectedImageFile(null);
        }
      } catch (err) {
        setSelectedImageFile(null);
      }
      return;
    }

    setImageSearchError('Could not read dragged image. Please drag an image directly or click to select.');
  };

  const handleBarcodeScanned = (scannedCode) => {
    if (activeBarcodeTarget === 'add') {
      setNewProduct(prev => ({ ...prev, barcode: scannedCode }));
    } else if (activeBarcodeTarget === 'edit') {
      setEditingProductData(prev => ({ ...prev, barcode: scannedCode }));
    }
  };

  const handleAddProductSubmit = async (e) => {
    e.preventDefault();
    const barcodeVal = (newProduct.barcode || '').trim();
    if (!barcodeVal) {
      alert('Barcode Number is mandatory. Please enter or scan a barcode.');
      return;
    }

    // Format validation
    const formatCheck = validateBarcodeFormat(barcodeVal);
    if (!formatCheck.isValid) {
      alert(`Invalid Barcode: ${formatCheck.error}`);
      return;
    }

    if (!newProduct.name.trim() || !newProduct.mrp) return;

    // Verify barcode uniqueness against Supabase & Catalog
    const barcodeCheck = await checkBarcodeInSupabase(barcodeVal);
    if (barcodeCheck.exists) {
      setBarcodeStatus({
        isChecking: false,
        exists: true,
        checkedBarcode: barcodeVal,
        matchedProduct: barcodeCheck.product,
        barcodeType: formatCheck.barcodeType,
        error: null,
        formatError: null
      });
      alert(`Barcode already exists! It is already assigned to "${barcodeCheck.product?.name || 'existing catalog product'}". Duplicate products cannot be saved.`);
      return;
    }

    setIsUploadingProduct(true);
    setImageSearchError(null);

    try {
      let finalImageUrl = newProduct.image;
      if (selectedImageFile) {
        try {
          const uploadedUrl = await uploadProductImage(selectedImageFile);
          if (uploadedUrl) {
            finalImageUrl = uploadedUrl;
          }
        } catch (uploadErr) {
          console.warn('Storage upload error, using direct image data:', uploadErr);
        }
      }

      const defaultImg = '';
      const mrpNum = Number(newProduct.mrp);
      
      // Validate role quantity tiers
      const normalizedNewTiers = normalizeQuantityTiers(newProduct.quantityTiers);
      for (const roleDef of DISCOUNT_ROLES) {
        const val = validateRoleTiers(normalizedNewTiers[roleDef.id] || [], roleDef.name);
        if (!val.isValid) {
          alert(`Quantity Tier Error in ${roleDef.name}: ${val.error}`);
          setIsUploadingProduct(false);
          return;
        }
      }

      await addProduct({
        ...newProduct,
        barcode: barcodeVal,
        image: finalImageUrl || defaultImg,
        mrp: mrpNum,
        generalPrice: Number(newProduct.generalPrice || mrpNum),
        salonPrice: Number(newProduct.salonPrice || 0),
        artistPrice: Number(newProduct.artistPrice || 0),
        beauticianPrice: Number(newProduct.beauticianPrice || 0),
        shades: newProduct.shades || [],
        quantityTiers: normalizedNewTiers
      });

      setNewProduct({
        name: '',
        brandName: brands[0]?.name || 'Lakmé',
        barcode: '',
        mrp: '',
        generalPrice: '',
        salonPrice: '',
        artistPrice: '',
        beauticianPrice: '',
        image: '',
        shades: [],
        quantityTiers: getDefaultQuantityTiers()
      });
      setNewProductDiscounts({
        salon: '',
        artist: '',
        beautician: ''
      });
      setSelectedImageFile(null);
      setCatalogSearchQuery('');
      setShowCatalogDropdown(false);
      setImageSearchError(null);
      setBarcodeStatus({
        isChecking: false,
        exists: false,
        checkedBarcode: '',
        matchedProduct: null,
        barcodeType: '',
        error: null,
        formatError: null
      });
      setShowProductSuccess(true);
      setIsAddProductModalOpen(false);
      setTimeout(() => setShowProductSuccess(false), 3000);
    } catch (err) {
      console.error('Error adding product:', err);
      setImageSearchError('Failed to save product: ' + (err.message || 'Unknown error'));
    } finally {
      setIsUploadingProduct(false);
    }
  };

  const handleOpenEditProduct = (product) => {
    const targetProduct = (product.isVariantChild && product.parentProduct) ? product.parentProduct : product;
    const foundInList = products.find(p => p.id === targetProduct.id);
    const finalCategory = targetProduct.category || foundInList?.category || '';
    const finalSubcategory = targetProduct.subcategory || foundInList?.subcategory || '';
    const base = Number(targetProduct.mrp || 0);
    const getInitialPct = (rolePrice) => {
      if (!base || !rolePrice || Number(rolePrice) <= 0 || Number(rolePrice) >= base) return '';
      const pct = Math.round((1 - Number(rolePrice) / base) * 100);
      return pct > 0 && pct < 100 ? String(pct) : '';
    };
    setEditProductDiscounts({
      general: targetProduct.discountPercentages?.general ? String(targetProduct.discountPercentages.general) : getInitialPct(targetProduct.generalPrice),
      salon: targetProduct.discountPercentages?.salon ? String(targetProduct.discountPercentages.salon) : getInitialPct(targetProduct.salonPrice),
      artist: targetProduct.discountPercentages?.artist ? String(targetProduct.discountPercentages.artist) : getInitialPct(targetProduct.artistPrice),
      beautician: targetProduct.discountPercentages?.beautician ? String(targetProduct.discountPercentages.beautician) : getInitialPct(targetProduct.beauticianPrice)
    });

    const existingVariants = targetProduct.shades ? [...targetProduct.shades] : (targetProduct.variants ? [...targetProduct.variants] : []);

    // Extract established attribute keys from existing saved variants
    const existingAttrKeys = new Set();
    existingVariants.forEach(v => {
      if (v.attributes && typeof v.attributes === 'object') {
        Object.keys(v.attributes).forEach(k => {
          if (k) existingAttrKeys.add(k);
        });
      }
    });

    // Obtain dynamic attribute suggestions based on product name, category, and subcategory
    const suggestions = getProductAttributeSuggestions({
      category: finalCategory,
      subcategory: finalSubcategory,
      productName: targetProduct.name
    });

    const initialAttrs = existingAttrKeys.size > 0
      ? Array.from(existingAttrKeys)
      : (suggestions.defaultAutoSelect && suggestions.defaultAutoSelect.length > 0 ? [...suggestions.defaultAutoSelect] : ['Size']);

    setEditProductActiveAttributes(initialAttrs);
    setShowAddVariantForm(false);
    setShowCustomAttrInput(false);
    setCustomAttributeInput('');
    setEditVariantDraft({
      name: '',
      attributes: {},
      hexColor: '#C2477A',
      price: '',
      barcode: ''
    });

    setEditingProductData({
      id: targetProduct.id,
      name: targetProduct.name,
      category: finalCategory,
      subcategory: finalSubcategory,
      brandName: targetProduct.brandName || brands[0]?.name || 'Lakmé',
      brandId: targetProduct.brandId || '',
      barcode: targetProduct.barcode || '',
      mrp: targetProduct.mrp || '',
      generalPrice: targetProduct.generalPrice || targetProduct.mrp || '',
      salonPrice: targetProduct.salonPrice || targetProduct.mrp || '',
      artistPrice: targetProduct.artistPrice || targetProduct.mrp || '',
      beauticianPrice: targetProduct.beauticianPrice || targetProduct.mrp || '',
      image: targetProduct.image || '',
      images: targetProduct.images || (targetProduct.image ? [targetProduct.image] : []),
      shades: existingVariants,
      quantityTiers: normalizeQuantityTiers(targetProduct.quantityTiers)
    });
    setEditBarcodeStatus({
      isChecking: false,
      exists: false,
      checkedBarcode: targetProduct.barcode || '',
      matchedProduct: null,
      barcodeType: '',
      error: null,
      formatError: null
    });
    setIsEditProductModalOpen(true);
  };

  const handleSaveEditProduct = async (e) => {
    e.preventDefault();
    if (!editingProductData || !editingProductData.id) return;

    const barcodeVal = (editingProductData.barcode || '').trim();
    if (barcodeVal) {
      const formatCheck = validateBarcodeFormat(barcodeVal);
      if (!formatCheck.isValid) {
        alert(`Invalid Barcode: ${formatCheck.error}`);
        return;
      }

      // Verify uniqueness against other products (excluding current)
      const check = await checkBarcodeInSupabase(barcodeVal, editingProductData.id);
      if (check.exists) {
        setEditBarcodeStatus({
          isChecking: false,
          exists: true,
          checkedBarcode: barcodeVal,
          matchedProduct: check.product,
          barcodeType: formatCheck.barcodeType,
          error: null,
          formatError: null
        });
        alert(`Barcode already exists! It is already assigned to "${check.product?.name || 'existing catalog product'}". Duplicate barcodes cannot be saved.`);
        return;
      }
    }

    // Validate role quantity tiers for edit across all 4 roles
    const normalizedEditTiers = normalizeQuantityTiers(editingProductData.quantityTiers);
    for (const roleDef of DISCOUNT_ROLES) {
      const val = validateRoleTiers(normalizedEditTiers[roleDef.id] || [], roleDef.name);
      if (!val.isValid) {
        alert(`Quantity Tier Error in ${roleDef.name}: ${val.error}`);
        return;
      }
    }

    const mrpNum = Number(editingProductData.mrp || 0);
    const generalPriceNum = editingProductData.generalPrice ? Number(editingProductData.generalPrice) : mrpNum;
    const salonPriceNum = editingProductData.salonPrice ? Number(editingProductData.salonPrice) : mrpNum;
    const artistPriceNum = editingProductData.artistPrice ? Number(editingProductData.artistPrice) : mrpNum;
    const beauticianPriceNum = editingProductData.beauticianPrice ? Number(editingProductData.beauticianPrice) : mrpNum;

    try {
      await updateProduct(editingProductData.id, {
        name: editingProductData.name,
        category: editingProductData.category,
        subcategory: editingProductData.subcategory,
        brandName: editingProductData.brandName,
        brandId: editingProductData.brandId,
        barcode: barcodeVal,
        mrp: mrpNum,
        generalPrice: generalPriceNum,
        salonPrice: salonPriceNum,
        artistPrice: artistPriceNum,
        beauticianPrice: beauticianPriceNum,
        image: editingProductData.image,
        shades: editingProductData.shades || [],
        discountPercentages: {
          general: Number(editProductDiscounts.general) || 0,
          salon: Number(editProductDiscounts.salon) || 0,
          artist: Number(editProductDiscounts.artist) || 0,
          beautician: Number(editProductDiscounts.beautician) || 0
        },
        quantityTiers: {
          ...normalizedEditTiers,
          roleDiscounts: {
            general: Number(editProductDiscounts.general) || 0,
            salon: Number(editProductDiscounts.salon) || 0,
            artist: Number(editProductDiscounts.artist) || 0,
            beautician: Number(editProductDiscounts.beautician) || 0
          }
        }
      });

      setIsEditProductModalOpen(false);
      setEditingProductData(null);
      setShowProductSuccess(true);
      setTimeout(() => setShowProductSuccess(false), 3000);
    } catch (err) {
      console.error('Error saving edited product:', err);
      alert('Failed to update product: ' + (err.message || 'Unknown error'));
    }
  };

  const handleStartEditProduct = (product) => {
    setEditingProductId(product.id);
    setEditPrices({
      mrp: product.mrp ?? 0,
      generalPrice: product.generalPrice !== undefined && product.generalPrice !== '' ? product.generalPrice : (product.mrp ?? 0),
      salonPrice: product.salonPrice !== undefined && product.salonPrice !== '' ? product.salonPrice : (product.mrp ?? 0),
      artistPrice: product.artistPrice !== undefined && product.artistPrice !== '' ? product.artistPrice : (product.mrp ?? 0),
      beauticianPrice: product.beauticianPrice !== undefined && product.beauticianPrice !== '' ? product.beauticianPrice : (product.mrp ?? 0),
      barcode: product.barcode || ''
    });
  };

  const handleSavePrices = (productId) => {
    updateProductRolePrices(productId, editPrices);
    setEditingProductId(null);
  };

  const handleOpenDeleteProduct = (product, variant = null) => {
    const parentProd = product.isVariantChild && product.parentProduct ? product.parentProduct : product;
    setProductToDelete(parentProd);
    if (variant) {
      setSelectedVariantToDelete(variant);
      setDeleteModeChoice('variant');
    } else {
      const hasVariants = parentProd.shades && Array.isArray(parentProd.shades) && parentProd.shades.length > 0;
      setDeleteModeChoice('full');
      setSelectedVariantToDelete(hasVariants ? parentProd.shades[0] : null);
    }
    setIsDeleteProductModalOpen(true);
  };

  const handleConfirmDeleteProduct = async () => {
    if (!productToDelete) return;
    setIsDeletingProduct(true);
    try {
      if (deleteModeChoice === 'variant' && selectedVariantToDelete) {
        await deleteProductVariant(productToDelete.id, selectedVariantToDelete.id || selectedVariantToDelete.name);
        setDashboardToast(`Variant "${selectedVariantToDelete.name}" permanently deleted.`);
      } else {
        await deleteProduct(productToDelete.id);
        setDashboardToast(`Product "${productToDelete.name}" permanently deleted from catalog.`);
      }
      setIsDeleteProductModalOpen(false);
      setProductToDelete(null);
      setSelectedVariantToDelete(null);
      setTimeout(() => setDashboardToast(null), 3500);
    } catch (err) {
      alert(`Deletion failed: ${err.message || err}`);
    } finally {
      setIsDeletingProduct(false);
    }
  };

  // Handlers for Catalog Matrix Table Product Quantity Tiers
  const handleToggleProductTiersPanel = (product) => {
    if (editingTiersProductId === product.id) {
      setEditingTiersProductId(null);
      setProductTiersLocal(getDefaultQuantityTiers());
      return;
    }
    setEditingTiersProductId(product.id);
    const existing = normalizeQuantityTiers(product.quantityTiers);
    setProductTiersLocal(existing);
    setTiersSaveSuccess(false);
  };

  const handleSaveProductTiers = async (productId) => {
    const normalized = normalizeQuantityTiers(productTiersLocal);
    for (const roleDef of DISCOUNT_ROLES) {
      const val = validateRoleTiers(normalized[roleDef.id] || [], roleDef.name);
      if (!val.isValid) {
        alert(`Validation Error (${roleDef.name}): ${val.error}`);
        return;
      }
    }
    setIsSavingTiers(true);
    try {
      await updateProductQuantityTiers(productId, normalized);
      setTiersSaveSuccess(true);
      setTimeout(() => {
        setTiersSaveSuccess(false);
        setEditingTiersProductId(null);
      }, 1200);
    } catch (e) {
      console.warn('Error saving product quantity tiers:', e);
      alert('Failed to save quantity tiers.');
    } finally {
      setIsSavingTiers(false);
    }
  };

  const handleSaveCancelFeeSettings = (e) => {
    e.preventDefault();
    updateCancelFeeSettings(feeForm);
    setShowFeeSuccess(true);
    setTimeout(() => setShowFeeSuccess(false), 3000);
  };

  const parseUserMeta = (u) => {
    let email = '';
    let city = '';
    let state = '';
    let pincode = '';
    let businessName = '';

    if (u && u.businessName) {
      if (typeof u.businessName === 'string' && u.businessName.trim().startsWith('{')) {
        try {
          const parsed = JSON.parse(u.businessName);
          email = parsed.email || '';
          city = parsed.city || '';
          state = parsed.state || '';
          pincode = parsed.pincode || '';
          businessName = parsed.businessName || parsed.business_name || '';
        } catch (e) {
          businessName = u.businessName;
        }
      } else {
        businessName = u.businessName;
      }
    }

    const roleMap = {
      general: 'General Retail',
      salon: 'Salon Owner',
      artist: 'Makeup Artist',
      beautician: 'Beautician'
    };

    const roleLabel = (u && u.role && roleMap[u.role.toLowerCase()]) || u?.role || 'General Retail';
    return { email, city, state, pincode, businessName, roleLabel };
  };

  const isB2BUserView = activeTab === 'users/b2b' || activeTab === 'user/b2b';

  const filteredB2CUsers = useMemo(() => {
    return (users || []).filter((u) => {
      const isB2B = ['salon', 'artist', 'beautician'].includes((u.role || '').toLowerCase());
      if (isB2B) return false;

      const meta = parseUserMeta(u);
      const term = (userSearchTerm || '').trim().toLowerCase();
      if (!term) return true;

      return (
        (u.name || '').toLowerCase().includes(term) ||
        (u.phone || '').includes(term) ||
        (meta.email || '').toLowerCase().includes(term) ||
        (meta.city || '').toLowerCase().includes(term) ||
        (meta.state || '').toLowerCase().includes(term)
      );
    });
  }, [users, userSearchTerm]);

  const filteredB2BUsers = useMemo(() => {
    return (users || []).filter((u) => {
      const roleLower = (u.role || '').toLowerCase();
      const isB2B = ['salon', 'artist', 'beautician'].includes(roleLower);
      if (!isB2B) return false;

      // Filter by B2B Type: All, Salon, Makeup Artist, Beautician
      if (b2bTypeFilter !== 'all' && roleLower !== b2bTypeFilter.toLowerCase()) {
        return false;
      }

      // Filter by Verification Status
      const matchingV = (b2bVerifications || []).find(v => v.user_id === u.id || v.userId === u.id);
      const curVerifStatus = (matchingV?.verification_status || u.verificationStatus || 'not_submitted').toLowerCase();

      if (b2bVerificationStatusFilter !== 'all') {
        if (b2bVerificationStatusFilter === 'pending') {
          if (!['submitted', 'pending'].includes(curVerifStatus)) return false;
        } else if (curVerifStatus !== b2bVerificationStatusFilter.toLowerCase()) {
          return false;
        }
      }

      const meta = parseUserMeta(u);
      const term = (userSearchTerm || '').trim().toLowerCase();
      if (!term) return true;

      const biz = (matchingV?.business_name || meta.businessName || '').toLowerCase();
      const profName = (matchingV?.professional_name || u.name || '').toLowerCase();
      const city = (matchingV?.city || meta.city || '').toLowerCase();

      return (
        (u.name || '').toLowerCase().includes(term) ||
        profName.includes(term) ||
        biz.includes(term) ||
        (u.phone || '').includes(term) ||
        (meta.email || '').toLowerCase().includes(term) ||
        city.includes(term)
      );
    });
  }, [users, b2bVerifications, b2bTypeFilter, b2bVerificationStatusFilter, userSearchTerm]);

  const displayedUsersList = isB2BUserView ? filteredB2BUsers : filteredB2CUsers;
  const filteredUsers = displayedUsersList;
  const totalUserPages = Math.max(1, Math.ceil(displayedUsersList.length / userRecordsPerPage));
  const effectiveUserPage = Math.min(userCurrentPage, totalUserPages);
  const userStartIndex = (effectiveUserPage - 1) * userRecordsPerPage;
  const paginatedUsers = displayedUsersList.slice(userStartIndex, userStartIndex + userRecordsPerPage);

  const filteredOrders = orders.filter((o) => {
    const matchesStatus = orderStatusFilter === 'all' || o.status === orderStatusFilter;
    const matchesBranch = selectedBranch === 'All Branches' || o.branch.toLowerCase().includes(selectedBranch.toLowerCase());
    return matchesStatus && matchesBranch;
  });

  const filteredBrands = useMemo(() => {
    const term = (brandSearch || '').trim().toLowerCase();
    if (!term) return brands;
    return brands.filter((b) =>
      (b.name || '').toLowerCase().includes(term) ||
      (b.category || '').toLowerCase().includes(term) ||
      (b.id || '').toLowerCase().includes(term)
    );
  }, [brands, brandSearch]);

  const totalBrandPages = Math.max(1, Math.ceil(filteredBrands.length / brandRecordsPerPage));
  const effectiveBrandPage = Math.min(brandCurrentPage, totalBrandPages);
  const brandStartIndex = (effectiveBrandPage - 1) * brandRecordsPerPage;
  const paginatedBrands = filteredBrands.slice(brandStartIndex, brandStartIndex + brandRecordsPerPage);

  const availableProductBrands = useMemo(() => {
    const set = new Set();
    (brands || []).forEach(b => { if (b.name) set.add(b.name.trim()); });
    (products || []).forEach(p => { if (p.brandName) set.add(p.brandName.trim()); });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [brands, products]);

  const availableProductCategories = useMemo(() => {
    const set = new Set();
    (categories || []).forEach(c => {
      const name = c.name || c.title;
      if (name) set.add(name.trim());
    });
    (products || []).forEach(p => { if (p.category) set.add(p.category.trim()); });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [categories, products]);

  const isBarcodeQuery = (term) => {
    if (!term) return false;
    const clean = term.trim();
    return clean.length >= 4 && !/\s/.test(clean) && (/^\d{4,48}$/.test(clean) || /^[A-Za-z0-9_-]{4,48}$/.test(clean));
  };

  const filteredProducts = useMemo(() => {
    const rawList = catalogViewMode === 'variants'
      ? flattenProductsToIndividualVariants(products)
      : products;

    const term = (productSearch || '').trim();

    return rawList.filter((p) => {
      let matchesSearch = true;
      if (term) {
        matchesSearch = matchProductSearch(p, term).isMatch;
      }

      const matchesBrand = productBrandFilter === 'all' ||
        (p.brandName || '').toLowerCase() === productBrandFilter.toLowerCase() ||
        (p.brandId && brands.find(b => b.id === p.brandId)?.name?.toLowerCase() === productBrandFilter.toLowerCase());

      const matchesCategory = productCategoryFilter === 'all' ||
        (p.category || '').toLowerCase() === productCategoryFilter.toLowerCase();

      return matchesSearch && matchesBrand && matchesCategory;
    });
  }, [products, catalogViewMode, productSearch, productBrandFilter, productCategoryFilter, brands]);

  const totalProductPages = Math.max(1, Math.ceil(filteredProducts.length / productRecordsPerPage));
  const effectiveProductPage = Math.min(productCurrentPage, totalProductPages);
  const productStartIndex = (effectiveProductPage - 1) * productRecordsPerPage;
  const paginatedProducts = filteredProducts.slice(productStartIndex, productStartIndex + productRecordsPerPage);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#FFF5F8] via-[#F8FAFC] to-[#FFF2F5] flex items-center justify-center p-4 font-sans antialiased">
        <div className="bg-white/90 backdrop-blur-md p-8 rounded-3xl border border-pink-100 shadow-2xl w-full max-w-md animate-fade-in text-center">
          <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-[#C2477A] to-[#E25586] text-white flex items-center justify-center font-bold mx-auto mb-4 shadow-md">
            <Sparkles size={32} />
          </div>

          <h1
            style={{ fontFamily: "'Great Vibes', cursive" }}
            className="text-4xl text-[#C2477A] font-normal tracking-wide leading-none mb-1"
          >
            Salbeau
          </h1>
          <p className="text-xs font-extrabold text-gray-800 uppercase tracking-wider mb-6">
            Admin Executive Portal
          </p>

          {loginError && (
            <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold text-left flex items-start gap-2">
              <AlertCircle size={15} className="text-rose-600 shrink-0 mt-0.5" />
              <span>{loginError}</span>
            </div>
          )}

          <form
            onSubmit={async (e) => {
              e.preventDefault();
              setLoginLoading(true);
              setLoginError(null);
              try {
                const res = await loginUser(loginCredentials.email, loginCredentials.password);
                if (res?.success) {
                  setIsAuthenticated(true);
                }
              } catch (err) {
                setLoginError(err.message || 'Login failed. Please check credentials or contact administrator.');
              } finally {
                setLoginLoading(false);
              }
            }}
            className="space-y-4 text-left text-xs"
          >
            <div>
              <label className="block text-gray-800 font-bold mb-1.5">Login Email</label>
              <input
                type="email"
                required
                placeholder="admin@salbeau.com or employee@salbeau.com"
                value={loginCredentials.email}
                onChange={(e) => setLoginCredentials({ ...loginCredentials, email: e.target.value })}
                className="w-full p-3 rounded-xl border border-pink-100/90 outline-none focus:border-[#C2477A] bg-white font-medium shadow-2xs text-gray-900 text-xs"
              />
            </div>

            <div>
              <label className="block text-gray-800 font-bold mb-1.5">Password</label>
              <input
                type="password"
                required
                value={loginCredentials.password}
                onChange={(e) => setLoginCredentials({ ...loginCredentials, password: e.target.value })}
                className="w-full p-3 rounded-xl border border-pink-100/90 outline-none focus:border-[#C2477A] bg-white font-medium shadow-2xs text-gray-900 text-xs"
              />
            </div>

            <button
              type="submit"
              disabled={loginLoading}
              className="w-full bg-gradient-to-r from-[#C2477A] to-[#E25586] hover:from-[#b83760] hover:to-[#C2477A] text-white py-3.5 rounded-xl font-bold text-xs shadow-md transition-all active:scale-[0.99] cursor-pointer mt-2 flex items-center justify-center gap-2 disabled:opacity-70"
            >
              {loginLoading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Verifying Account...</span>
                </>
              ) : (
                <span>Sign In to Console</span>
              )}
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
    } else if (newStatus === 'accepted') {
      const target = orders.find(o => o.id === orderId);
      setAcceptanceTargetOrder(target || { id: orderId });
      setItemsConfirmedAvailable(false);
      setIsAcceptanceModalOpen(true);
    } else {
      updateOrderStatus(orderId, newStatus);
    }
  };

  const handleConfirmAcceptance = () => {
    if (acceptanceTargetOrder?.id) {
      updateOrderStatus(acceptanceTargetOrder.id, 'accepted');
    }
    setIsAcceptanceModalOpen(false);
    setAcceptanceTargetOrder(null);
    setItemsConfirmedAvailable(false);
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


  return (
    <div className="min-h-screen bg-white text-[#1F2937] flex flex-col md:flex-row font-sans antialiased overflow-x-hidden">
      {/* Mobile Top Header */}
      <header className="md:hidden sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-pink-100/80 px-4 py-2.5 flex items-center justify-between shadow-2xs">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setIsMobileDrawerOpen(true)}
            className="w-9 h-9 rounded-xl flex items-center justify-center text-gray-700 hover:text-[#C2477A] hover:bg-[#FFF5F8] border border-pink-100/70 transition-all cursor-pointer"
            aria-label="Open menu"
            title="Open menu"
          >
            <Menu size={18} />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-[#C2477A] text-white flex items-center justify-center shadow-xs">
              <Sparkles size={14} />
            </div>
            <span
              style={{ fontFamily: "'Great Vibes', cursive" }}
              className="text-2xl text-[#C2477A] leading-none select-none"
            >
              Salbeau
            </span>
          </div>
        </div>

        {/* Current Active Section Badge on Mobile */}
        <span className="text-[11px] font-bold text-[#C2477A] bg-[#FFF5F8] px-2.5 py-1 rounded-full border border-pink-200/50 truncate max-w-[130px]">
          {getActiveTabLabel(activeTab)}
        </span>
      </header>

      {/* Mobile Slide-out Drawer */}
      {isMobileDrawerOpen && (
        <div
          className="md:hidden fixed inset-0 z-50 bg-black/40 backdrop-blur-xs transition-opacity duration-300"
          onClick={() => setIsMobileDrawerOpen(false)}
        >
          <div
            className="w-[240px] max-w-[80vw] h-full bg-white shadow-2xl flex flex-col justify-between p-4 overflow-y-auto no-scrollbar animate-fade-in"
            onClick={(e) => e.stopPropagation()}
          >
            <div>
              {/* Drawer Header */}
              <div className="flex items-center justify-between mb-5 pb-3 border-b border-pink-100/60">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-[#C2477A] text-white flex items-center justify-center shadow-xs">
                    <Sparkles size={16} />
                  </div>
                  <h1
                    style={{ fontFamily: "'Great Vibes', cursive" }}
                    className="text-2xl text-[#C2477A]"
                  >
                    Salbeau
                  </h1>
                </div>
                <button
                  type="button"
                  onClick={() => setIsMobileDrawerOpen(false)}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
                  aria-label="Close menu"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Drawer Navigation */}
              <nav className="space-y-3">
                {filteredNavSections.map((section) => (
                  <div key={section.title} className="space-y-1">
                    <div className="text-[10px] font-black uppercase tracking-wider text-gray-400 px-3 py-1 select-none">
                      {section.title}
                    </div>
                    <div className="space-y-0.5">
                      {section.items.map((item) => {
                        const Icon = item.icon;
                        const isActive = isItemActive(item.id);
                        const hasSubItems = Array.isArray(item.subItems) && item.subItems.length > 0;
                        const isSubOpen = openSubmenus[item.id] || (hasSubItems && item.subItems.some(sub => isItemActive(sub.id)));

                        return (
                          <div key={item.id} className="space-y-0.5">
                            <button
                              onClick={() => {
                                if (item.isAction && item.id === 'logout') {
                                  setIsMobileDrawerOpen(false);
                                  setIsLogoutModalOpen(true);
                                  return;
                                }
                                if (hasSubItems) {
                                  setOpenSubmenus(prev => ({
                                    ...prev,
                                    [item.id]: !prev[item.id]
                                  }));
                                  return;
                                }
                                navigateToTab(item.id);
                                setIsMobileDrawerOpen(false);
                              }}
                              className={`w-full px-3 py-2 rounded-xl font-semibold text-xs flex items-center justify-between transition-all cursor-pointer ${
                                isActive
                                  ? 'bg-[#FFF5F8] text-[#C2477A] font-bold'
                                  : 'text-gray-600 hover:bg-[#FFF5F8]/50 hover:text-[#C2477A]'
                              }`}
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                <Icon size={16} className={`shrink-0 ${isActive ? 'text-[#C2477A]' : 'text-gray-500'}`} />
                                <span className="truncate">{item.label}</span>
                              </div>
                              <div className="flex items-center gap-1.5 shrink-0">
                                {item.badge !== undefined && item.badge !== null && (
                                  <span
                                    className={
                                      item.isPillBadge
                                        ? item.badgeClass
                                        : `text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${item.badgeClass || ''}`
                                    }
                                  >
                                    {item.badge}
                                  </span>
                                )}
                                {hasSubItems && (
                                  <ChevronDown
                                    size={14}
                                    className={`text-gray-400 transition-transform ${isSubOpen ? 'rotate-180 text-[#C2477A]' : ''}`}
                                  />
                                )}
                              </div>
                            </button>

                            {/* Mobile Drawer Sub-items */}
                            {hasSubItems && isSubOpen && (
                              <div className="ml-4 pl-2.5 border-l-2 border-pink-100 space-y-0.5 py-1">
                                {item.subItems.map((sub) => {
                                  const SubIcon = sub.icon || null;
                                  const isSubActive = isItemActive(sub.id);
                                  return (
                                    <button
                                      key={sub.id}
                                      onClick={() => {
                                        navigateToTab(sub.id);
                                        setIsMobileDrawerOpen(false);
                                      }}
                                      className={`w-full px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-between transition-all cursor-pointer ${
                                        isSubActive
                                          ? 'bg-[#FFF5F8] text-[#C2477A] font-bold'
                                          : 'text-gray-500 hover:bg-[#FFF5F8]/40 hover:text-[#C2477A]'
                                      }`}
                                    >
                                      <div className="flex items-center gap-2 min-w-0">
                                        {SubIcon && <SubIcon size={13} className="shrink-0" />}
                                        <span className="truncate">{sub.label}</span>
                                      </div>
                                      {sub.badge !== undefined && sub.badge !== null && (
                                        <span className={sub.badgeClass || 'text-[9.5px] font-bold px-1.5 py-0.2 rounded-full bg-pink-100 text-[#C2477A]'}>
                                          {sub.badge}
                                        </span>
                                      )}
                                    </button>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </nav>
            </div>

            {/* Drawer Footer */}
            <div className="pt-3 border-t border-pink-100/60 space-y-2.5 mt-4">
              <button
                onClick={() => {
                  setIsMobileDrawerOpen(false);
                  setIsLogoutModalOpen(true);
                }}
                className="w-full px-3 py-2.5 rounded-xl font-bold text-xs text-rose-600 bg-rose-50 hover:bg-rose-100 flex items-center justify-between transition-all cursor-pointer border border-rose-100/80 shadow-2xs"
              >
                <div className="flex items-center gap-2">
                  <LogOut size={16} />
                  <span>Log Out</span>
                </div>
                <span className="text-[10px] text-[#C2477A] font-bold bg-white px-2 py-0.5 rounded-md border border-pink-100 uppercase">
                  {currentAuthUser?.role === 'employee' ? 'EMPLOYEE' : 'ADMIN'}
                </span>
              </button>
              <div className="text-[11px] text-gray-400 font-medium px-1">
                Salbeau Admin v1.0
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Desktop/Tablet Responsive Sidebar */}
      <aside
        className={`hidden md:flex flex-col justify-between sticky top-0 h-screen bg-white border-r border-pink-100/70 shadow-2xs flex-shrink-0 z-30 transition-all duration-300 ease-in-out select-none ${
          isSidebarCollapsed ? 'w-[68px] p-2' : 'w-[230px] p-3.5'
        }`}
      >
        <div className="flex flex-col flex-1 min-h-0">
          {/* Sidebar Header with Hamburger */}
          {!isSidebarCollapsed ? (
            <div className="flex items-center justify-between mb-4 px-1 pb-3 border-b border-pink-100/50">
              <div className="flex items-center gap-2.5 overflow-hidden">
                <h1
                  style={{ fontFamily: "'Great Vibes', cursive" }}
                  className="text-2xl text-[#C2477A] font-normal tracking-wide leading-none truncate select-none"
                >
                  Salbeau
                </h1>
              </div>
              <button
                type="button"
                onClick={toggleSidebar}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-500 hover:text-[#C2477A] hover:bg-[#FFF5F8] transition-all cursor-pointer shrink-0"
                title="Collapse sidebar"
                aria-label="Collapse sidebar"
              >
                <Menu size={18} />
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2 mb-4 pb-3 border-b border-pink-100/50">
              <button
                type="button"
                onClick={toggleSidebar}
                className="w-9 h-9 rounded-xl flex items-center justify-center text-gray-600 hover:text-[#C2477A] hover:bg-[#FFF5F8] transition-all border border-pink-100/70 shadow-2xs cursor-pointer"
                title="Expand sidebar"
                aria-label="Expand sidebar"
              >
                <Menu size={18} />
              </button>
            </div>
          )}

          {/* Navigation Items */}
          <nav className={`space-y-2 overflow-y-auto no-scrollbar flex-1 -mx-0.5 px-0.5 ${isSidebarCollapsed ? 'flex flex-col items-center' : ''}`}>
            {filteredNavSections.map((section) => (
              <div key={section.title} className={isSidebarCollapsed ? 'w-full flex flex-col items-center mb-1' : 'mb-2.5'}>
                {!isSidebarCollapsed ? (
                  <div className="text-[9.5px] font-black uppercase tracking-wider text-gray-400 px-3 py-1 select-none">
                    {section.title}
                  </div>
                ) : (
                  <div className="w-6 border-b border-gray-100 my-1 opacity-70" />
                )}

                <div className={isSidebarCollapsed ? 'space-y-1 w-full flex flex-col items-center' : 'space-y-0.5'}>
                  {section.items.map((item) => {
                    const Icon = item.icon;
                    const isActive = isItemActive(item.id);
                    const hasSubItems = Array.isArray(item.subItems) && item.subItems.length > 0;
                    const isSubOpen = openSubmenus[item.id] || (hasSubItems && item.subItems.some(sub => isItemActive(sub.id)));
                    const tooltipBadge = item.badge || (hasSubItems ? item.subItems.find(s => isItemActive(s.id))?.label : null);

                    if (isSidebarCollapsed) {
                      return (
                        <button
                          key={item.id}
                          onClick={() => {
                            if (item.isAction && item.id === 'logout') {
                              setIsLogoutModalOpen(true);
                              return;
                            }
                            if (hasSubItems) {
                              navigateToTab(item.subItems[0].id);
                              return;
                            }
                            navigateToTab(item.id);
                          }}
                          onMouseEnter={(e) => handleTooltipEnter(e, item.label, tooltipBadge)}
                          onMouseLeave={handleTooltipLeave}
                          className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all relative cursor-pointer group ${
                            isActive
                              ? 'bg-[#FFF5F8] text-[#C2477A] shadow-2xs ring-1 ring-[#C2477A]/20'
                              : 'text-gray-500 hover:bg-[#FFF5F8]/60 hover:text-[#C2477A]'
                          }`}
                          aria-label={item.label}
                        >
                          <Icon size={18} className={`shrink-0 transition-transform ${isActive ? 'scale-110 text-[#C2477A]' : 'group-hover:scale-110'}`} />
                          {item.badge !== undefined && item.badge !== null && (
                            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#C2477A] ring-2 ring-white" />
                          )}
                        </button>
                      );
                    }

                    return (
                      <div key={item.id} className="space-y-0.5">
                        <button
                          key={item.id}
                          onClick={() => {
                            if (item.isAction && item.id === 'logout') {
                              setIsLogoutModalOpen(true);
                              return;
                            }
                            if (hasSubItems) {
                              setOpenSubmenus(prev => ({
                                ...prev,
                                [item.id]: !prev[item.id]
                              }));
                              const isCurrentlyInside = item.subItems.some(sub => isItemActive(sub.id));
                              if (!isCurrentlyInside) {
                                navigateToTab(item.subItems[0].id);
                              }
                              return;
                            }
                            navigateToTab(item.id);
                          }}
                          className={`w-full px-3 py-2 rounded-xl font-semibold text-xs flex items-center justify-between transition-all cursor-pointer group ${
                            isActive
                              ? 'bg-[#FFF5F8] text-[#C2477A] shadow-2xs font-bold'
                              : 'text-gray-600 hover:bg-[#FFF5F8]/50 hover:text-[#C2477A]'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <Icon size={16} className={`shrink-0 transition-transform ${isActive ? 'scale-105 text-[#C2477A]' : 'group-hover:scale-105'}`} />
                            <span className="truncate">{item.label}</span>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            {item.badge !== undefined && item.badge !== null && (
                              <span
                                className={
                                  item.isPillBadge
                                    ? item.badgeClass
                                    : `text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${item.badgeClass || ''}`
                                }
                              >
                                {item.badge}
                              </span>
                            )}
                            {hasSubItems && (
                              <ChevronDown
                                size={14}
                                className={`text-gray-400 transition-transform duration-200 ${isSubOpen ? 'rotate-180 text-[#C2477A]' : ''}`}
                              />
                            )}
                          </div>
                        </button>

                        {/* Nested Sub-items in Expanded Mode */}
                        {hasSubItems && isSubOpen && (
                          <div className="ml-4 pl-2.5 border-l-2 border-pink-100 space-y-0.5 py-0.5 animate-fade-in">
                            {item.subItems.map((sub) => {
                              const SubIcon = sub.icon || null;
                              const isSubActive = isItemActive(sub.id);
                              return (
                                <button
                                  key={sub.id}
                                  onClick={() => navigateToTab(sub.id)}
                                  className={`w-full px-2.5 py-1.5 rounded-lg text-[11px] font-semibold flex items-center justify-between transition-all cursor-pointer ${
                                    isSubActive
                                      ? 'bg-[#FFF5F8] text-[#C2477A] font-bold'
                                      : 'text-gray-500 hover:bg-[#FFF5F8]/40 hover:text-[#C2477A]'
                                  }`}
                                >
                                  <div className="flex items-center gap-2 min-w-0">
                                    {SubIcon && <SubIcon size={12} className="shrink-0" />}
                                    <span className="truncate">{sub.label}</span>
                                  </div>
                                  {sub.badge !== undefined && sub.badge !== null && (
                                    <span className={sub.badgeClass || 'text-[9.5px] font-bold px-1.5 py-0.2 rounded-full bg-pink-100 text-[#C2477A]'}>
                                      {sub.badge}
                                    </span>
                                  )}
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>
        </div>

        {/* Desktop Sidebar Footer */}
        <div className="pt-3 border-t border-pink-100/60 mt-auto">
          {!isSidebarCollapsed ? (
            <div className="space-y-2.5">
              <button
                onClick={() => setIsLogoutModalOpen(true)}
                className="w-full px-3 py-2.5 rounded-xl font-bold text-xs text-rose-600 bg-rose-50 hover:bg-rose-100 flex items-center justify-between transition-all cursor-pointer border border-rose-100/80 shadow-2xs active:scale-[0.98]"
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
          ) : (
            <div className="flex flex-col items-center gap-2">
              <button
                onClick={() => setIsLogoutModalOpen(true)}
                onMouseEnter={(e) => handleTooltipEnter(e, 'Log Out', 'Active')}
                onMouseLeave={handleTooltipLeave}
                className="w-10 h-10 rounded-xl font-bold text-xs text-rose-600 bg-rose-50 hover:bg-rose-100 flex items-center justify-center transition-all cursor-pointer border border-rose-100/80 shadow-2xs active:scale-[0.98]"
                title="Log Out"
                aria-label="Log Out"
              >
                <LogOut size={16} />
              </button>

              <span className="text-[10px] text-gray-400 font-semibold tracking-tighter" title="Salbeau Admin v1.0">
                v1.0
              </span>
            </div>
          )}
        </div>
      </aside>

      {/* Floating Tooltip for Collapsed Sidebar */}
      {hoveredTooltip && isSidebarCollapsed && (
        <div
          className="fixed z-[9999] pointer-events-none -translate-y-1/2 flex items-center transition-opacity duration-150 animate-fade-in"
          style={{ top: hoveredTooltip.top, left: hoveredTooltip.left }}
        >
          <div className="w-1.5 h-1.5 bg-gray-900 rotate-45 -mr-1 z-10" />
          <div className="bg-gray-900 text-white text-xs font-semibold px-2.5 py-1.5 rounded-lg shadow-xl flex items-center gap-1.5 border border-gray-700/60 whitespace-nowrap">
            <span>{hoveredTooltip.label}</span>
            {hoveredTooltip.badge !== undefined && hoveredTooltip.badge !== null && (
              <span className="text-[10px] bg-[#C2477A] text-white px-1.5 py-0.2 rounded-full font-bold leading-normal">
                {hoveredTooltip.badge}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className={`flex-1 min-w-0 transition-all duration-300 ${
        activeTab === 'products/bulk'
          ? 'p-0 bg-[#F8FAFD] h-screen max-h-screen overflow-hidden flex flex-col min-h-0'
          : activeTab === 'products/new'
          ? 'p-0 bg-[#FFF8FA] min-h-screen overflow-y-auto'
          : 'p-4 sm:p-6 lg:p-8 bg-white min-h-screen overflow-y-auto'
      }`}>
        {/* Top Header (Shown for standard dashboard tabs) */}
        {activeTab !== 'products/new' && activeTab !== 'products/bulk' && (
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
            <div className="flex items-center gap-3">
              {isSidebarCollapsed && (
                <button
                  type="button"
                  onClick={toggleSidebar}
                  className="hidden md:flex w-9 h-9 rounded-xl items-center justify-center text-gray-600 hover:text-[#C2477A] hover:bg-pink-50 border border-pink-100/80 bg-white shadow-2xs transition-all cursor-pointer shrink-0"
                  title="Expand sidebar"
                  aria-label="Expand sidebar"
                >
                  <Menu size={18} />
                </button>
              )}
              <div>
                <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
                {activeTab === 'dashboard' && 'Dashboard Overview'}
                {activeTab === 'dashboard_visibility' && 'Dashboard Visibility & Section Access'}
                {activeTab === 'home_banners' && 'Home Screen Banners Manager'}
                {activeTab === 'categories' && 'Category & Subcategory Image Manager'}
                {activeTab === 'order_updated' && 'Order Management'}
                {activeTab === 'add_brand' && 'Add Brand'}
                {activeTab === 'products' && 'Products'}
                {activeTab === 'approval_center' && 'Employee Operations & Approval Center'}
                {(activeTab === 'user' || activeTab.startsWith('user') || activeTab.startsWith('users')) && (activeTab.includes('b2b') ? 'B2B Users Management' : 'B2C Users Management')}
                {(activeTab.startsWith('b2b-verification') || activeTab.startsWith('b2b_verification')) && (
                  activeTab.includes('salon')
                    ? 'Salon Verification Panel'
                    : (activeTab.includes('makeup') || activeTab.includes('artist'))
                    ? 'Makeup Artist Verification Panel'
                    : activeTab.includes('beautician')
                    ? 'Beautician Verification Panel'
                    : 'B2B Professional Verification'
                )}
                {activeTab === 'quick_panel' && 'Quick Panel — Command Center'}
                {activeTab === 'cancel_fee' && 'Cancel Fee Policy'}
                {activeTab === 'pricing_rules' && 'Pricing Rules & Discount Configuration'}
                {activeTab === 'search_requests' && 'Customer Search Requests & Search Activity'}
                {activeTab === 'abandoned_carts' && 'Abandoned Carts & Cart Recovery'}
                {activeTab === 'employees' && 'Employee Management'}
                {activeTab === 'employees/new' && 'Add New Employee'}
                {activeTab === 'employees/activity' && 'Employee Activity Monitoring'}
                {activeTab.startsWith('employees/') && !activeTab.includes('activity') && !activeTab.includes('new') && 'Employee Profile & Management'}
              </h1>
              <p className="text-xs text-gray-400 font-medium mt-1">
                {activeTab === 'home_banners' && 'Manage the carousel banners displayed on the customer mobile app home page. Changes sync in real-time.'}
                {activeTab === 'search_requests' && 'Real-time tracking of all customer searches (found and not-found) performed in the User App'}
                {activeTab === 'approval_center' && 'Review and approve/reject employee operations before they go live on the customer store'}
                {activeTab === 'audit_trail' && 'Immutable activity history showing who performed what, when, and approval status'}
                {activeTab === 'abandoned_carts' && 'Real-time tracking of incomplete orders and potential recoveries'}
                {activeTab === 'employees' && 'Manage employee accounts, permissions, assigned work, and activity'}
                {activeTab === 'employees/new' && 'Create employee account and configure access'}
                {activeTab === 'employees/activity' && 'Real-time audit log of employee actions across modules'}
                {!activeTab.startsWith('employees') && activeTab !== 'abandoned_carts' && "Overview of today's store performance"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
                            {/* Customer Search Requests Quick Button with Live Counter Badge */}
              <button
                onClick={() => navigateToTab('search_requests')}
                title="Customer Search Requests"
                className={`relative p-2.5 rounded-xl border transition-all cursor-pointer ${
                  activeTab === 'search_requests'
                    ? 'bg-[#C2477A] text-white border-[#C2477A]'
                    : 'bg-white hover:bg-[#FFF5F8] text-black border-[#FCE4EC] shadow-2xs'
                }`}
              >
                <Search size={16} />
                {(searchRequests || []).filter(r => !r.status || r.status === 'pending').length > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-[#C2477A] text-white text-[10px] font-black rounded-full flex items-center justify-center animate-pulse">
                    {(searchRequests || []).filter(r => !r.status || r.status === 'pending').length}
                  </span>
                )}
              </button>

              {/* Abandoned Cart Quick Button with Live Counter Badge */}
              <button
                onClick={() => navigateToTab('abandoned_carts')}
                title="Abandoned Carts Tracking & Recovery"
                className={`relative p-2.5 rounded-xl border transition-all cursor-pointer ${
                  activeTab === 'abandoned_carts'
                    ? 'bg-[#C2477A] text-white border-[#C2477A]'
                    : 'bg-white hover:bg-pink-50 text-gray-700 border-pink-100 shadow-2xs'
                }`}
              >
                <ShoppingCart size={16} />
                {abandonedCarts.filter(c => (c.status || 'abandoned') === 'abandoned').length > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-amber-500 text-white text-[10px] font-black rounded-full flex items-center justify-center animate-pulse">
                    {abandonedCarts.filter(c => (c.status || 'abandoned') === 'abandoned').length}
                  </span>
                )}
              </button>

            </div>
          </div>
        )}

        {/* 1. EXECUTIVE DASHBOARD PAGE */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6 animate-fade-in">
            {/* Error Alert Banner (if Supabase fetch fails) */}
            {fetchError && (
              <div className="bg-rose-50 border border-rose-200/80 rounded-2xl p-4 flex items-center justify-between text-rose-800 text-xs shadow-2xs">
                <div className="flex items-center gap-2">
                  <AlertCircle size={16} className="text-rose-600 shrink-0" />
                  <span className="font-semibold">Unable to load dashboard data: {fetchError}</span>
                </div>
                <button
                  type="button"
                  onClick={() => refreshData && refreshData()}
                  className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs cursor-pointer shadow-xs transition-colors flex items-center gap-1.5 active:scale-95"
                >
                  <RefreshCw size={13} />
                  <span>Retry</span>
                </button>
              </div>
            )}

            {/* Top 4 Metric Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Card 1: Total Store Orders */}
              <div className="bg-white border border-pink-100/70 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-gray-500 tracking-wide">
                    Total Store Orders
                  </span>
                  <div className="w-10 h-10 rounded-full bg-[#FFF5F8] text-[#C2477A] flex items-center justify-center shadow-2xs">
                    <ShoppingBag size={18} />
                  </div>
                </div>
                <div className="mt-4">
                  {isLoading ? (
                    <div className="animate-pulse space-y-2">
                      <div className="h-8 bg-gray-200 rounded-lg w-24"></div>
                      <div className="h-4 bg-gray-100 rounded-md w-32"></div>
                    </div>
                  ) : (
                    <>
                      <div className="text-3xl font-extrabold text-gray-900 tracking-tight">
                        {totalOrdersCount}
                      </div>
                      <div className={`flex items-center gap-1.5 text-xs font-semibold mt-2 ${
                        kpiComparisons.orders.direction === 'up' ? 'text-emerald-600' :
                        kpiComparisons.orders.direction === 'down' ? 'text-rose-600' : 'text-gray-500'
                      }`}>
                        {kpiComparisons.orders.direction === 'up' && <TrendingUp size={14} />}
                        {kpiComparisons.orders.direction === 'down' && <TrendingDown size={14} />}
                        {kpiComparisons.orders.direction === 'neutral' && <Minus size={14} />}
                        <span>{kpiComparisons.orders.text}</span>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Card 2: Total Revenue */}
              <div className="bg-white border border-pink-100/70 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-gray-500 tracking-wide">
                    Total Revenue
                  </span>
                  <div className="w-10 h-10 rounded-full bg-[#FFF5F8] text-[#C2477A] flex items-center justify-center shadow-2xs">
                    <DollarSign size={18} />
                  </div>
                </div>
                <div className="mt-4">
                  {isLoading ? (
                    <div className="animate-pulse space-y-2">
                      <div className="h-8 bg-gray-200 rounded-lg w-32"></div>
                      <div className="h-4 bg-gray-100 rounded-md w-36"></div>
                    </div>
                  ) : (
                    <>
                      <div className="text-3xl font-extrabold text-gray-900 tracking-tight">
                        {totalRevenueAmount}
                      </div>
                      <div className={`flex items-center gap-1.5 text-xs font-semibold mt-2 ${
                        kpiComparisons.revenue.direction === 'up' ? 'text-emerald-600' :
                        kpiComparisons.revenue.direction === 'down' ? 'text-rose-600' : 'text-gray-500'
                      }`}>
                        {kpiComparisons.revenue.direction === 'up' && <TrendingUp size={14} />}
                        {kpiComparisons.revenue.direction === 'down' && <TrendingDown size={14} />}
                        {kpiComparisons.revenue.direction === 'neutral' && <Minus size={14} />}
                        <span>{kpiComparisons.revenue.text}</span>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Card 3: Active Brands Ratio */}
              <div className="bg-white border border-pink-100/70 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-gray-500 tracking-wide">
                    Active Brands Ratio
                  </span>
                  <div className="w-10 h-10 rounded-full bg-[#FFF5F8] text-[#C2477A] flex items-center justify-center shadow-2xs">
                    <Star size={18} />
                  </div>
                </div>
                <div className="mt-4">
                  {isLoading ? (
                    <div className="animate-pulse space-y-2">
                      <div className="h-8 bg-gray-200 rounded-lg w-20"></div>
                      <div className="h-4 bg-gray-100 rounded-md w-28"></div>
                    </div>
                  ) : (
                    <>
                      <div className="text-3xl font-extrabold text-gray-900 tracking-tight">
                        {activeBrandsRatio}
                      </div>
                      <div className="flex items-center gap-1.5 text-gray-500 text-xs font-semibold mt-2">
                        <CheckCircle2 size={14} className="text-emerald-600" />
                        <span>{kpiComparisons.brands.text}</span>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Card 4: Staff & Employee Overview */}
              <div 
                onClick={() => navigateToTab('employees')}
                className="bg-white border border-pink-100/70 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between cursor-pointer group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-gray-500 tracking-wide group-hover:text-[#C2477A] transition-colors">
                    Active Employees
                  </span>
                  <div className="w-10 h-10 rounded-full bg-[#FFF5F8] text-[#C2477A] flex items-center justify-center shadow-2xs group-hover:scale-105 transition-transform">
                    <Users size={18} />
                  </div>
                </div>
                <div className="mt-4">
                  <div className="text-3xl font-extrabold text-gray-900 tracking-tight">
                    {(employees || []).filter(e => e.status === 'active').length}
                    <span className="text-sm font-semibold text-gray-400 ml-1.5">/ {employees.length}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[#C2477A] text-xs font-semibold mt-2">
                    <ShieldCheck size={14} />
                    <span>Manage Staff & Permissions →</span>
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
                    className="appearance-none bg-[#FFF5F8] text-[#C2477A] border border-pink-100 text-xs font-semibold px-4 py-1.5 pr-8 rounded-xl outline-none cursor-pointer"
                  >
                    {availableBranches.map((br) => (
                      <option key={br} value={br}>
                        {br}
                      </option>
                    ))}
                  </select>
                  <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#C2477A] pointer-events-none" />
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
                    {isLoading ? (
                      [1, 2, 3].map((n) => (
                        <tr key={n} className="animate-pulse border-b border-gray-100">
                          <td className="py-4 px-4 rounded-l-xl">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-gray-200" />
                              <div className="space-y-1.5">
                                <div className="h-4 bg-gray-200 rounded w-28" />
                                <div className="h-3 bg-gray-100 rounded w-36" />
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-4"><div className="h-4 bg-gray-200 rounded w-20" /></td>
                          <td className="py-4 px-4"><div className="h-4 bg-gray-200 rounded w-24" /></td>
                          <td className="py-4 px-4"><div className="h-7 bg-gray-200 rounded-xl w-32" /></td>
                          <td className="py-4 px-4 text-right"><div className="h-4 bg-gray-200 rounded w-16 ml-auto" /></td>
                          <td className="py-4 px-4 text-center rounded-r-xl"><div className="h-7 bg-gray-200 rounded-xl w-16 mx-auto" /></td>
                        </tr>
                      ))
                    ) : filteredOrders.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-12 text-center text-gray-400">
                          <div className="flex flex-col items-center justify-center gap-2">
                            <Package size={32} className="text-gray-300" />
                            <span className="font-semibold text-sm text-gray-500">No orders found</span>
                            <span className="text-xs text-gray-400">
                              {selectedBranch !== 'All Branches'
                                ? `No orders found for branch "${selectedBranch}"`
                                : 'New customer orders will appear here automatically in real time.'}
                            </span>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      filteredOrders.map((order, index) => (
                        <tr
                          key={order.id}
                          className={`transition-colors ${
                            index % 2 === 1 ? 'bg-[#FFF2F5]/80 hover:bg-[#FFF5F8]' : 'bg-white hover:bg-[#FFF2F5]/40'
                          }`}
                        >
                          <td className="py-3.5 px-4 rounded-l-xl">
                            <div className="flex items-center gap-3">
                              {order.avatar ? (
                                <img
                                  src={order.avatar}
                                  alt={order.userName}
                                  onError={(e) => { e.target.style.display = 'none'; }}
                                  className="w-10 h-10 rounded-full object-cover border border-gray-100 shadow-2xs"
                                />
                              ) : (
                                <div className="w-10 h-10 rounded-full bg-pink-100 text-[#C2477A] font-bold flex items-center justify-center text-xs">
                                  {(order.userName || 'U').slice(0, 2).toUpperCase()}
                                </div>
                              )}
                              <div>
                                <div className="font-bold text-sm text-gray-900">{order.userName}</div>
                                <div className="text-xs text-gray-400 font-medium mt-0.5 max-w-xs truncate">
                                  {order.itemDescription || (order.items && order.items[0]?.product?.name) || 'Cosmetics Set'}
                                </div>
                                {order.deliveryType === 'delivery' && order.deliveryAddress && (
                                  <div className="text-[10px] text-gray-500 font-medium flex items-center gap-1 mt-1 max-w-xs truncate">
                                    <MapPin size={10} className="text-[#C2477A] flex-shrink-0" />
                                    <span className="truncate">{order.deliveryAddress}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="space-y-1">
                              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#FFF5F8] text-[#C2477A] whitespace-nowrap inline-block">
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
                              <FulfillmentStatusSelector
                                order={order}
                                onUpdateStatus={updateOrderStatus}
                                onSuccessToast={(msg) => setDashboardToast(msg)}
                              />
                              {order.status === 'rejected' && order.rejectionReason && (
                                <div className="text-[10px] text-rose-600 font-semibold bg-rose-50 px-2 py-0.5 rounded-md border border-rose-100 max-w-xs truncate">
                                  Reason: {order.rejectionReason}
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="py-3.5 px-4 text-right font-bold text-sm text-[#C2477A] whitespace-nowrap">
                            ₹{typeof order.totalAmount === 'number' ? order.totalAmount.toLocaleString('en-IN') : order.totalAmount}
                          </td>
                          <td className="py-3.5 px-4 rounded-r-xl text-center whitespace-nowrap">
                            <button
                              onClick={() => {
                                setSelectedInvoiceOrder(order);
                                setIsInvoiceModalOpen(true);
                              }}
                              className="bg-white hover:bg-[#FFF5F8] text-[#C2477A] border border-pink-200 px-2.5 py-1.5 rounded-xl font-bold text-[11px] flex items-center gap-1 mx-auto transition-colors cursor-pointer shadow-2xs"
                            >
                              <FileText size={13} /> Receipt
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* 1b. DASHBOARD VISIBILITY PAGE */}
        {activeTab === 'dashboard_visibility' && (
          <div className="space-y-6 animate-fade-in">
            {/* Header / Info Banner */}
            <div className="bg-gradient-to-r from-pink-50 via-rose-50 to-white p-6 rounded-2xl border border-pink-200/80 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Eye className="text-[#C2477A]" size={20} />
                  <h2 className="text-base font-bold text-gray-900">Mobile Home Page Section Access</h2>
                </div>
                <p className="text-xs text-gray-600 max-w-2xl leading-relaxed">
                  Toggle visibility for individual sections on the Customer Mobile App Home Page in real-time. Turning off a section removes it from the customer view immediately.
                </p>
              </div>
              <button
                onClick={resetHomeSectionVisibility}
                className="bg-white hover:bg-rose-50 text-[#C2477A] border border-pink-200 px-4 py-2.5 rounded-xl text-xs font-bold shadow-2xs transition-colors flex items-center gap-2 cursor-pointer shrink-0"
              >
                <Sparkles size={14} />
                <span>Reset All to Visible</span>
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Toggles List */}
              <div className="lg:col-span-2 space-y-4">
                {[
                  {
                    key: 'branchBar',
                    title: 'Store Branch Selector Bar',
                    desc: 'Top sticky bar displaying store location selector, search button, and cart counter.',
                    icon: MapPin,
                    tag: 'Header Sticky Bar'
                  },
                  {
                    key: 'pricingRoleBanner',
                    title: 'Pricing Role Tier Badge',
                    desc: 'Sub-header displaying current customer role pricing mode (Salon, Artist, Beautician, Retail).',
                    icon: Sparkles,
                    tag: 'Customer Role Banner'
                  },
                  {
                    key: 'heroPromoBanner',
                    title: 'Hero Promotional Perk Banner',
                    desc: 'Gradient promotional banner offering up to 35% discount perks for professional profiles.',
                    icon: Star,
                    tag: 'Promo Card'
                  },
                  {
                    key: 'shopCategories',
                    title: 'Shop Categories Section',
                    desc: 'Horizontal scroll strip showing top product category circles (Hair, Skin, Lips, Eyes, Nails).',
                    icon: LayoutGrid,
                    tag: 'Categories Strip'
                  },
                  {
                    key: 'featuredBrands',
                    title: 'Featured Brands Section',
                    desc: 'Horizontal strip displaying active partner brand logos and brand details.',
                    icon: Store,
                    tag: 'Brands Carousel'
                  },
                  {
                    key: 'bestSellers',
                    title: 'Best Sellers Product Grid',
                    desc: '2-column product catalog grid with role-sensitive prices and catalog status.',
                    icon: Package,
                    tag: 'Product Catalog Grid'
                  }
                ].map((sec) => {
                  const isVisible = (homeSectionVisibility && homeSectionVisibility[sec.key] !== false) ?? true;
                  const IconComp = sec.icon;

                  return (
                    <div
                      key={sec.key}
                      className={`bg-white border rounded-2xl p-5 shadow-2xs transition-all flex items-center justify-between gap-4 ${isVisible ? 'border-pink-200 hover:border-pink-300' : 'border-gray-200 opacity-60 bg-gray-50/50'
                        }`}
                    >
                      <div className="flex items-start gap-3.5">
                        <div
                          className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${isVisible ? 'bg-[#FFF5F8] text-[#C2477A]' : 'bg-gray-100 text-gray-400'
                            }`}
                        >
                          <IconComp size={20} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-xs font-bold text-gray-900">{sec.title}</h3>
                            <span className="text-[10px] font-semibold text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                              {sec.tag}
                            </span>
                          </div>
                          <p className="text-[11px] text-gray-500 mt-0.5 leading-snug">{sec.desc}</p>
                        </div>
                      </div>

                      {/* Toggle Switch */}
                      <button
                        onClick={() => toggleHomeSectionVisibility && toggleHomeSectionVisibility(sec.key)}
                        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${isVisible ? 'bg-[#C2477A]' : 'bg-gray-300'
                          }`}
                        role="switch"
                        aria-checked={isVisible}
                      >
                        <span
                          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${isVisible ? 'translate-x-5' : 'translate-x-0'
                            }`}
                        />
                      </button>
                    </div>
                  );
                })}
              </div>

              {/* Mobile Live Mockup Preview */}
              <div className="bg-white border border-pink-200/80 rounded-2xl p-5 shadow-2xs flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-3 border-b border-pink-100 pb-3">
                    <div className="flex items-center gap-2">
                      <Store size={16} className="text-[#C2477A]" />
                      <h3 className="text-xs font-bold text-gray-900">Mobile Home Page Layout Preview</h3>
                    </div>
                    <span className="text-[10px] font-bold text-[#C2477A] bg-[#FFF5F8] px-2 py-0.5 rounded-full">
                      Live State
                    </span>
                  </div>

                  <p className="text-[11px] text-gray-500 mb-4 leading-relaxed">
                    Visual simulation of the Customer App Home Screen reflecting your current visibility settings:
                  </p>

                  <div className="w-full max-w-[260px] mx-auto border-4 border-gray-800 rounded-[28px] overflow-hidden bg-[#FFF8FA] shadow-md text-[10px]">
                    {/* Simulated Mobile Header */}
                    {(!homeSectionVisibility || homeSectionVisibility.branchBar !== false) ? (
                      <div className="bg-white p-2 border-b border-pink-100 flex items-center justify-between text-[#C2477A] font-semibold">
                        <span className="flex items-center gap-1"><MapPin size={10} /> MG Road Branch</span>
                        <div className="flex items-center gap-1.5">
                          <Search size={10} />
                          <ShoppingBag size={10} />
                        </div>
                      </div>
                    ) : (
                      <div className="bg-gray-100 p-1.5 text-center text-gray-400 italic text-[9px]">Branch Bar Hidden</div>
                    )}

                    {/* Simulated Role Bar */}
                    {(!homeSectionVisibility || homeSectionVisibility.pricingRoleBanner !== false) && (
                      <div className="bg-[#FCE4EC] px-2 py-1 flex items-center justify-between text-[#8C7078] text-[9px]">
                        <span>Role: Salon Owner</span>
                        <span className="text-[#C2477A] font-bold">Change</span>
                      </div>
                    )}

                    {/* Simulated Hero Promo */}
                    {(!homeSectionVisibility || homeSectionVisibility.heroPromoBanner !== false) ? (
                      <div className="m-2 bg-gradient-to-r from-[#C2477A] to-[#E25586] p-2.5 rounded-xl text-white">
                        <div className="font-bold text-[10px]">Salbeau Tier Savings</div>
                        <div className="text-[8px] text-white/80">Up to 35% discount</div>
                      </div>
                    ) : (
                      <div className="m-2 p-1.5 bg-gray-100 text-center text-gray-400 italic rounded-lg text-[9px]">Promo Banner Hidden</div>
                    )}

                    {/* Simulated Categories */}
                    {(!homeSectionVisibility || homeSectionVisibility.shopCategories !== false) ? (
                      <div className="px-2 py-1">
                        <div className="font-bold text-[#3A2430] text-[9px] mb-1">Categories</div>
                        <div className="flex gap-1.5 overflow-hidden">
                          {['Hair', 'Skin', 'Lips', 'Eyes'].map((c, idx) => (
                            <div key={idx} className="w-9 h-9 rounded-lg bg-[#FCE4EC] flex flex-col items-center justify-center text-[8px] font-semibold text-[#3A2430]">
                              {c}
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="px-2 py-1 text-center text-gray-400 italic text-[9px]">Categories Hidden</div>
                    )}

                    {/* Simulated Brands */}
                    {(!homeSectionVisibility || homeSectionVisibility.featuredBrands !== false) ? (
                      <div className="px-2 py-1 border-t border-pink-100/60 mt-1">
                        <div className="font-bold text-[#3A2430] text-[9px] mb-1">Featured Brands</div>
                        <div className="flex gap-1 overflow-hidden">
                          {['Lakmé', 'Maybelline', 'L\'Oréal'].map((b, idx) => (
                            <div key={idx} className="bg-white border border-pink-100 rounded px-1.5 py-0.5 text-[8px] font-bold text-[#3A2430]">
                              {b}
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="px-2 py-1 text-center text-gray-400 italic text-[9px]">Brands Hidden</div>
                    )}

                    {/* Simulated Best Sellers */}
                    {(!homeSectionVisibility || homeSectionVisibility.bestSellers !== false) ? (
                      <div className="p-2 border-t border-pink-100/60 mt-1">
                        <div className="font-bold text-[#3A2430] text-[9px] mb-1">Best Sellers</div>
                        <div className="grid grid-cols-2 gap-1.5">
                          {[1, 2].map((i) => (
                            <div key={i} className="bg-white p-1 rounded-lg border border-pink-100">
                              <div className="w-full h-8 bg-pink-50 rounded mb-1"></div>
                              <div className="font-bold text-[8px] text-[#C2477A]">₹450</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="p-2 border-t border-pink-100/60 mt-1 text-center text-gray-400 italic text-[9px]">Best Sellers Hidden</div>
                    )}
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-pink-100 text-[11px] text-gray-500 font-medium text-center">
                  Changes take effect immediately on Customer App
                </div>
              </div>
            </div>

            {/* AUTOMATIC PRODUCT RECOMMENDATIONS CONTROLS (ADD-ONS & RELEVANT PRODUCTS) */}
            <div className="mt-6 bg-white border border-pink-200/80 rounded-2xl p-6 shadow-2xs">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-4 border-b border-pink-100 gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#FFF0F5] text-[#C2477A] flex items-center justify-center border border-pink-200 shrink-0">
                    <Sparkles size={20} />
                  </div>
                  <div>
                    <h2 className="text-sm font-extrabold text-[#3A2430]">
                      Automatic Product Recommendations Controls
                    </h2>
                    <p className="text-[11px] text-gray-500">
                      Configure complementary Add-Ons ("Complete Your Look ✨" / "Complete Your Order ✨") and discovery ("You May Also Like 💜")
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={async () => {
                      await resetRecommendationConfig();
                      setDashboardToast({ type: 'success', message: 'Recommendations reset to defaults!' });
                    }}
                    className="px-3 py-1.5 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <RotateCcw size={13} />
                    <span>Reset Defaults</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-5">
                {/* 1. Global Enable / Disable */}
                <div className="p-4 rounded-xl border border-pink-100 bg-[#FFF8FA] flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs font-bold text-gray-900">Automatic Recommendations</h4>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        recommendationConfig?.enabled !== false ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                      }`}>
                        {recommendationConfig?.enabled !== false ? 'Active' : 'Disabled'}
                      </span>
                    </div>
                    <p className="text-[11px] text-gray-500 mt-1 max-w-sm">
                      Master toggle for customer app Add-Ons and You May Also Like carousels.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={async () => {
                      const next = recommendationConfig?.enabled === false ? true : false;
                      await updateRecommendationConfig({ enabled: next });
                      setDashboardToast({ type: 'success', message: `Automatic recommendations ${next ? 'enabled' : 'disabled'}!` });
                    }}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      recommendationConfig?.enabled !== false ? 'bg-[#C2477A]' : 'bg-gray-300'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                        recommendationConfig?.enabled !== false ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                {/* 2. Maximum Recommendations Count */}
                <div className="p-4 rounded-xl border border-pink-100 bg-white flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-gray-900">Maximum Cards Per Carousel</h4>
                    <p className="text-[11px] text-gray-500 mt-1 max-w-sm">
                      Number of recommended products visible in horizontal scroll sections.
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {[4, 6, 8, 12].map((num) => {
                      const isCurrent = (recommendationConfig?.maxAddOns || 8) === num;
                      return (
                        <button
                          key={num}
                          type="button"
                          onClick={async () => {
                            await updateRecommendationConfig({ maxAddOns: num, maxRelevant: num });
                            setDashboardToast({ type: 'success', message: `Max recommendations set to ${num}!` });
                          }}
                          className={`w-8 h-8 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                            isCurrent
                              ? 'bg-[#C2477A] text-white shadow-xs'
                              : 'bg-gray-100 text-gray-600 hover:bg-pink-50'
                          }`}
                        >
                          {num}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 3. Routine Complementary / Frequently Bought Together */}
                <div className="p-4 rounded-xl border border-pink-100 bg-white flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-gray-900">Frequently Bought Together & Routine Pairs</h4>
                    <p className="text-[11px] text-gray-500 mt-1 max-w-sm">
                      Prioritize complementary steps (e.g., Foundation + Primer/Blender; Lipstick + Liner).
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={async () => {
                      const next = recommendationConfig?.frequentlyBoughtTogether === false ? true : false;
                      await updateRecommendationConfig({ frequentlyBoughtTogether: next });
                      setDashboardToast({ type: 'success', message: `Routine pairings ${next ? 'enabled' : 'disabled'}!` });
                    }}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      recommendationConfig?.frequentlyBoughtTogether !== false ? 'bg-[#C2477A]' : 'bg-gray-300'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                        recommendationConfig?.frequentlyBoughtTogether !== false ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                {/* 4. Popular Products Fallback */}
                <div className="p-4 rounded-xl border border-pink-100 bg-[#FFF8FA] flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-gray-900">Popular Products Fallback</h4>
                    <p className="text-[11px] text-gray-500 mt-1 max-w-sm">
                      Fill empty slots with top active catalog products if specific pairs are sparse.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={async () => {
                      const next = recommendationConfig?.popularProductsFallback === false ? true : false;
                      await updateRecommendationConfig({ popularProductsFallback: next });
                      setDashboardToast({ type: 'success', message: `Popular fallback ${next ? 'enabled' : 'disabled'}!` });
                    }}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      recommendationConfig?.popularProductsFallback !== false ? 'bg-[#C2477A]' : 'bg-gray-300'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                        recommendationConfig?.popularProductsFallback !== false ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 1c. HOME BANNERS MANAGEMENT PAGE */}
        {activeTab === 'home_banners' && (
          <div className="space-y-6 animate-fade-in">
            {/* Header / Info Banner */}
            <div className="bg-gradient-to-r from-pink-50 via-rose-50 to-white p-6 rounded-2xl border border-pink-200/80 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-8 h-8 rounded-xl bg-[#FFF5F8] text-[#C2477A] flex items-center justify-center font-bold shadow-2xs">
                    <ImageIcon size={18} />
                  </div>
                  <h2 className="text-base font-bold text-gray-900">Mobile Home Carousel Banners</h2>
                  <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                    Live Real-Time Sync
                  </span>
                </div>
                <p className="text-xs text-gray-600 max-w-2xl leading-relaxed">
                  Manage the 5 full-width marketing banners displayed in the customer mobile app carousel. Admin updates, reordering, and status changes are permanently saved in Supabase and instantly reflected on the User App.
                </p>
              </div>

              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={handleOpenAddBanner}
                  className="bg-gradient-to-r from-[#C2477A] to-[#E25586] hover:from-[#b83760] hover:to-[#C2477A] text-white px-4 py-2.5 rounded-xl text-xs font-bold shadow-sm hover:shadow transition-all flex items-center gap-2 cursor-pointer shrink-0 active:scale-95"
                >
                  <Plus size={15} />
                  <span>Add New Banner</span>
                </button>
              </div>
            </div>

            {/* Notification alert banner */}
            {bannerNotice && (
              <div className={`p-4 rounded-xl text-xs font-bold flex items-center gap-2 animate-fade-in ${
                bannerNotice.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-800 border border-rose-200'
              }`}>
                {bannerNotice.type === 'success' ? <CheckCircle2 size={16} className="text-emerald-600" /> : <AlertCircle size={16} className="text-rose-600" />}
                <span>{bannerNotice.message}</span>
              </div>
            )}

            {/* Banners Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {(homeBanners || []).map((banner, index) => {
                const isActive = banner.isActive !== false;
                return (
                  <div
                    key={banner.id || index}
                    className={`bg-white rounded-3xl border overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col justify-between ${
                      isActive ? 'border-pink-200/80 hover:border-pink-300' : 'border-gray-200 opacity-70 bg-gray-50/50'
                    }`}
                  >
                    {/* Top Image Preview Banner */}
                    <div className="relative w-full aspect-[2.56/1] bg-gray-100 overflow-hidden border-b border-pink-100">
                      {banner.imageUrl ? (
                        <img
                          src={banner.imageUrl}
                          alt={banner.title || 'Banner'}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                          No Image
                        </div>
                      )}

                      {/* Display Order Position Badge */}
                      <div className="absolute top-2.5 left-2.5 bg-black/75 backdrop-blur-xs text-white text-[10px] font-black px-2 py-0.5 rounded-full flex items-center gap-1 shadow-xs">
                        <span>#{index + 1}</span>
                      </div>

                      {/* Active Status Badge */}
                      <div className="absolute top-2.5 right-2.5">
                        <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full shadow-xs ${
                          isActive ? 'bg-emerald-500 text-white' : 'bg-gray-400 text-white'
                        }`}>
                          {isActive ? 'Active' : 'Hidden'}
                        </span>
                      </div>

                      {/* Live CTA button simulated on the image */}
                      <div className="absolute bottom-2 left-2.5 bg-[#C2477A] text-white text-[9.5px] font-extrabold px-2.5 py-0.5 rounded-full shadow-xs">
                        {banner.ctaText || banner.ctaLabel || 'Shop Now →'}
                      </div>
                    </div>

                    {/* Banner Content Body */}
                    <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-black tracking-wider uppercase text-[#C2477A] bg-[#FFF0F5] px-2 py-0.5 rounded-md border border-[#FCE4EC]">
                            {banner.theme || banner.badge || 'EDITORIAL'}
                          </span>
                          <span className="text-[10px] text-gray-400 font-mono">
                            ID: {banner.id}
                          </span>
                        </div>

                        <h3 className="font-extrabold text-sm text-gray-900 leading-snug">
                          {banner.title}
                        </h3>

                        <p className="text-[11px] text-gray-500 line-clamp-2 leading-relaxed">
                          {banner.subtitle || 'Discover authentic salon-grade products.'}
                        </p>
                      </div>

                      {/* Destination Details */}
                      <div className="pt-2 border-t border-pink-100/70 text-[11px] space-y-1">
                        <div className="flex items-center justify-between text-gray-600">
                          <span className="text-gray-400 font-medium">Destination:</span>
                          <span className="font-extrabold text-gray-900 bg-gray-100 px-2 py-0.5 rounded-md">
                            {banner.destinationType || 'CATEGORY'}
                            {banner.destinationId ? ` (${banner.destinationId})` : ''}
                          </span>
                        </div>
                      </div>

                      {/* Controls Toolbar */}
                      <div className="pt-3 border-t border-pink-100/70 flex items-center justify-between gap-2">
                        {/* Move Up/Down Order */}
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            disabled={index === 0}
                            onClick={() => handleMoveBannerOrder(banner.id, 'up')}
                            className="w-7 h-7 rounded-lg border border-gray-200 text-gray-600 hover:text-[#C2477A] hover:bg-pink-50 flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors"
                            title="Move Up"
                          >
                            <ArrowUp size={13} />
                          </button>
                          <button
                            type="button"
                            disabled={index === (homeBanners || []).length - 1}
                            onClick={() => handleMoveBannerOrder(banner.id, 'down')}
                            className="w-7 h-7 rounded-lg border border-gray-200 text-gray-600 hover:text-[#C2477A] hover:bg-pink-50 flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors"
                            title="Move Down"
                          >
                            <ArrowDown size={13} />
                          </button>
                        </div>

                        {/* Actions (Toggle, Edit, Delete) */}
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => toggleHomeBannerActive(banner.id)}
                            className={`px-2.5 py-1 rounded-lg text-[10.5px] font-bold border transition-colors cursor-pointer ${
                              isActive
                                ? 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'
                                : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                            }`}
                          >
                            {isActive ? 'Hide' : 'Show'}
                          </button>

                          <button
                            type="button"
                            onClick={() => handleOpenEditBanner(banner)}
                            className="px-2.5 py-1 rounded-lg text-[10.5px] font-bold bg-[#FFF5F8] text-[#C2477A] border border-[#FCE4EC] hover:bg-pink-100 transition-colors flex items-center gap-1 cursor-pointer"
                          >
                            <Edit size={11} /> Edit
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setBannerToDelete(banner);
                              setIsDeleteBannerModalOpen(true);
                            }}
                            className="w-7 h-7 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-200 flex items-center justify-center transition-colors cursor-pointer"
                            title="Delete Banner"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* MAIN CATEGORIES MANAGEMENT */}
        {activeTab === 'categories' && (
          <MainCategoriesManager
            onRefreshMaster={() => {
              if (typeof refreshData === 'function') refreshData();
            }}
            onNavigateToProducts={({ category }) => {
              if (category) {
                setProductCategoryFilter(category);
              } else {
                setProductCategoryFilter('all');
              }
              setProductCurrentPage(1);
              navigateToTab('products');
            }}
          />
        )}

        {/* 2. ORDER UPDATED PAGE */}
        {activeTab === 'order_updated' && (
          <div className="space-y-6 animate-fade-in">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-2xl border border-pink-100/70 shadow-xs">
              <div className="flex items-center gap-2">
                <Filter size={16} className="text-[#C2477A]" />
                <span className="text-xs font-semibold text-gray-700">Status Filter:</span>
                <select
                  value={orderStatusFilter}
                  onChange={(e) => setOrderStatusFilter(e.target.value)}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold bg-[#FFF5F8] border border-pink-100 text-[#C2477A] outline-none cursor-pointer"
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
                Total Queue: <span className="text-[#C2477A] font-bold text-sm">{orders.length} Orders</span>
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
                    <th className="py-4 px-4 text-left">Assigned Staff</th>
                    <th className="py-4 px-4 text-left">Fulfillment Status</th>
                    <th className="py-4 px-4 text-right">Amount</th>
                    <th className="py-4 px-4 text-center rounded-r-xl">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredOrders.map((o, index) => (
                    <tr
                      key={o.id}
                      className={`transition-colors ${index % 2 === 1 ? 'bg-[#FFF2F5]/80 hover:bg-[#FFF5F8]' : 'bg-white hover:bg-[#FFF2F5]/40'
                        }`}
                    >
                      <td className="p-4 font-extrabold text-[#C2477A] text-xs">{o.id}</td>
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
                            <MapPin size={10} className="text-[#C2477A] flex-shrink-0" />
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
                        <select
                          value={o.assignedEmployeeId || ''}
                          onChange={(e) => assignOrderToEmployee(o.id, e.target.value || null)}
                          className="px-2.5 py-1.5 text-xs rounded-xl border border-pink-100 bg-[#FFF8FA] font-medium text-gray-700 outline-none focus:border-[#C2477A] cursor-pointer"
                        >
                          <option value="">Unassigned</option>
                          {(employees || []).filter(e => e.status === 'active').map(emp => (
                            <option key={emp.id} value={emp.id}>
                              {emp.full_name} ({emp.employee_code})
                            </option>
                          ))}
                        </select>
                        {o.assignedEmployeeName && (
                          <div className="text-[10px] text-gray-400 mt-1 flex items-center gap-1 font-medium">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                            <span>{o.assignedEmployeeName}</span>
                          </div>
                        )}
                      </td>
                      <td className="p-4 whitespace-nowrap">
                        <div className="space-y-1">
                          <FulfillmentStatusSelector
                            order={o}
                            onUpdateStatus={updateOrderStatus}
                            onSuccessToast={(msg) => setDashboardToast(msg)}
                          />
                          {o.status === 'rejected' && o.rejectionReason && (
                            <div className="text-[10px] text-rose-600 font-semibold bg-rose-50 px-2 py-0.5 rounded-md border border-rose-100">
                              Reason: {o.rejectionReason}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="p-4 text-right font-extrabold text-[#C2477A] text-sm whitespace-nowrap">
                        ₹{typeof o.totalAmount === 'number' ? o.totalAmount.toLocaleString('en-IN') : o.totalAmount}
                      </td>
                      <td className="p-4 text-center whitespace-nowrap">
                        <button
                          onClick={() => {
                            setSelectedInvoiceOrder(o);
                            setIsInvoiceModalOpen(true);
                          }}
                          className="bg-white hover:bg-[#FFF5F8] text-[#C2477A] border border-pink-200 px-3 py-1.5 rounded-xl font-bold text-[11px] flex items-center gap-1 mx-auto transition-colors cursor-pointer shadow-2xs"
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
                <div className="flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-2xl bg-[#FFF5F8] border border-pink-100 text-[#C2477A] flex items-center justify-center font-bold shadow-2xs shrink-0">
                    <Store size={20} />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-base text-gray-900 tracking-wide uppercase flex items-center gap-2">
                      <span>Partner Brand Directory</span>
                    </h3>
                    <span className="text-xs text-gray-400 font-medium mt-0.5 block">
                      {filteredBrands.length} partner brands active in store catalog
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex items-center gap-2 bg-[#FFF5F8] px-3.5 py-2 rounded-xl border border-pink-100 w-full sm:w-64 focus-within:ring-2 focus-within:ring-[#C2477A]/20 transition-all">
                    <Search size={14} className="text-[#C2477A]" />
                    <input
                      type="text"
                      placeholder="Search brand name..."
                      value={brandSearch}
                      onChange={(e) => {
                        setBrandSearch(e.target.value);
                        setBrandCurrentPage(1);
                      }}
                      className="bg-transparent text-xs outline-none text-gray-900 w-full font-medium placeholder:text-gray-400"
                    />
                    {brandSearch && (
                      <button
                        type="button"
                        onClick={() => {
                          setBrandSearch('');
                          setBrandCurrentPage(1);
                        }}
                        className="text-gray-400 hover:text-gray-600 cursor-pointer"
                      >
                        <X size={12} />
                      </button>
                    )}
                  </div>

                  <button
                    onClick={handleOpenAddBrand}
                    className="bg-[#C2477A] hover:bg-[#b83760] text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-xs flex items-center gap-2 cursor-pointer transition-all active:scale-[0.98]"
                  >
                    <BadgePlus size={16} />
                    <span>Add New Brand</span>
                  </button>
                </div>
              </div>

              {/* Brand Directory Table Format */}
              <div className="overflow-x-auto rounded-xl border border-pink-100/70">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-[#FFF2F5] text-gray-900 uppercase font-black text-xs tracking-wider border-b border-pink-100/80">
                      <th className="py-4 px-4 text-left">
                        <div className="flex items-center gap-1.5">
                          <Tag size={13} className="text-[#C2477A]" />
                          <span>BRAND & LOGO</span>
                        </div>
                      </th>
                      <th className="py-4 px-4 text-left">
                        <div className="flex items-center gap-1.5">
                          <Sparkles size={13} className="text-[#C2477A]" />
                          <span>CATEGORY</span>
                        </div>
                      </th>
                      <th className="py-4 px-4 text-left">
                        <div className="flex items-center gap-1.5">
                          <Package size={13} className="text-[#C2477A]" />
                          <span>PRODUCTS CATALOG</span>
                        </div>
                      </th>
                      <th className="py-4 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <Eye size={13} className="text-[#C2477A]" />
                          <span>BRAND VISIBILITY</span>
                        </div>
                      </th>
                      <th className="py-4 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Edit size={13} className="text-[#C2477A]" />
                          <span>ACTION</span>
                        </div>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100/70">
                    {paginatedBrands.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-12 px-6 text-center text-gray-400">
                          <Store size={32} className="mx-auto mb-2 text-gray-300" />
                          <p className="font-bold text-sm text-gray-600">No partner brands found</p>
                          <p className="text-xs text-gray-400 mt-0.5">
                            {brands.length === 0
                              ? 'No partner brands registered yet. Click "Add New Brand" to add your first brand.'
                              : 'Try adjusting your search query or clear the filter.'}
                          </p>
                        </td>
                      </tr>
                    ) : (
                      paginatedBrands.map((brand, index) => {
                        const brandProductsCount = products.filter(p => p.brandName === brand.name).length;
                        return (
                          <tr
                            key={brand.id}
                            className={`transition-colors ${index % 2 === 1 ? 'bg-[#FFF2F5]/60 hover:bg-[#FFF5F8]' : 'bg-white hover:bg-[#FFF2F5]/30'
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
                              <span className="text-[10px] font-semibold text-[#8C7078] bg-[#FFF5F8] px-2.5 py-1 rounded-full border border-pink-100/60">
                                {brand.category}
                              </span>
                            </td>
                            <td className="py-3.5 px-4 whitespace-nowrap text-gray-700 font-semibold">
                              <div className="flex items-center gap-1.5">
                                <Package size={13} className="text-[#C2477A]" />
                                <span>{brandProductsCount > 0 ? `${brandProductsCount} Items` : 'Catalog Active'}</span>
                              </div>
                            </td>
                            <td className="py-3.5 px-4 text-center whitespace-nowrap">
                              <div className="inline-flex items-center gap-2.5">
                                <button
                                  type="button"
                                  onClick={() => toggleBrandStatus(brand.id)}
                                  className={`relative inline-flex h-5 w-10 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                                    brand.enabled ? 'bg-emerald-500' : 'bg-gray-300'
                                  }`}
                                  title={brand.enabled ? 'Click to make Inactive in User App' : 'Click to make Active in User App'}
                                >
                                  <span
                                    className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow transition duration-200 ease-in-out ${
                                      brand.enabled ? 'translate-x-5' : 'translate-x-0'
                                    }`}
                                  />
                                </button>
                                <span
                                  className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border ${
                                    brand.enabled
                                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                      : 'bg-gray-100 text-gray-500 border-gray-200'
                                  }`}
                                >
                                  {brand.enabled ? 'Active' : 'Inactive'}
                                </span>
                              </div>
                            </td>
                            <td className="py-3.5 px-4 text-right whitespace-nowrap">
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  onClick={() => handleOpenEditBrand(brand)}
                                  className="px-3 py-1.5 rounded-xl text-[11px] font-extrabold border border-pink-200 bg-white hover:bg-[#FFF5F8] hover:border-[#C2477A] text-[#C2477A] flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer group active:scale-95"
                                  title="Edit Brand details and visibility"
                                >
                                  <Edit size={12} className="group-hover:scale-110 transition-transform" />
                                  <span>Edit</span>
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {/* Brand Table Pagination Controls */}
              <div className="bg-[#FFF8FA] px-6 py-4 mt-3 rounded-2xl border border-pink-100 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-semibold text-gray-600">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500 font-medium">Rows per page:</span>
                    <select
                      value={brandRecordsPerPage}
                      onChange={(e) => {
                        setBrandRecordsPerPage(Number(e.target.value));
                        setBrandCurrentPage(1);
                      }}
                      className="px-2.5 py-1.5 rounded-lg border border-pink-200 bg-white text-gray-800 font-bold outline-none cursor-pointer focus:border-[#C2477A]"
                    >
                      <option value={15}>15</option>
                      <option value={20}>20</option>
                      <option value={30}>30</option>
                      <option value={50}>50</option>
                      <option value={100}>100</option>
                    </select>
                  </div>

                  <span className="text-gray-400">|</span>

                  <span>
                    Showing{' '}
                    <strong className="text-gray-900 font-bold">
                      {filteredBrands.length === 0 ? 0 : brandStartIndex + 1}
                    </strong>
                    {' '}-{' '}
                    <strong className="text-gray-900 font-bold">
                      {Math.min(brandStartIndex + brandRecordsPerPage, filteredBrands.length)}
                    </strong>
                    {' '}of{' '}
                    <strong className="text-gray-900 font-bold">{filteredBrands.length}</strong>
                  </span>
                </div>

                {/* Page Navigation Buttons */}
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setBrandCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={brandCurrentPage <= 1}
                    className={`p-2 rounded-xl border flex items-center justify-center transition-all ${
                      brandCurrentPage <= 1
                        ? 'border-gray-200 text-gray-300 cursor-not-allowed bg-gray-50'
                        : 'border-pink-200 text-[#C2477A] bg-white hover:bg-pink-50 cursor-pointer shadow-2xs'
                    }`}
                    title="Previous Page"
                  >
                    <ChevronLeft size={16} />
                  </button>

                  {Array.from({ length: totalBrandPages }, (_, i) => i + 1)
                    .filter((page) => {
                      if (totalBrandPages <= 5) return true;
                      return (
                        page === 1 ||
                        page === totalBrandPages ||
                        Math.abs(page - effectiveBrandPage) <= 1
                      );
                    })
                    .map((page, idx, arr) => {
                      const showEllipsis = idx > 0 && page - arr[idx - 1] > 1;
                      return (
                        <React.Fragment key={page}>
                          {showEllipsis && <span className="px-1 text-gray-400">...</span>}
                          <button
                            onClick={() => setBrandCurrentPage(page)}
                            className={`min-w-[32px] h-8 px-2 rounded-xl font-bold text-xs transition-all ${
                              effectiveBrandPage === page
                                ? 'bg-[#C2477A] text-white shadow-xs'
                                : 'bg-white border border-pink-200 text-gray-700 hover:bg-pink-50 cursor-pointer'
                            }`}
                          >
                            {page}
                          </button>
                        </React.Fragment>
                      );
                    })}

                  <button
                    onClick={() => setBrandCurrentPage((p) => Math.min(totalBrandPages, p + 1))}
                    disabled={brandCurrentPage >= totalBrandPages}
                    className={`p-2 rounded-xl border flex items-center justify-center transition-all ${
                      brandCurrentPage >= totalBrandPages
                        ? 'border-gray-200 text-gray-300 cursor-not-allowed bg-gray-50'
                        : 'border-pink-200 text-[#C2477A] bg-white hover:bg-pink-50 cursor-pointer shadow-2xs'
                    }`}
                    title="Next Page"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 5B. ADD NEW PRODUCT DEDICATED FULL-PAGE ROUTE (/admin/products/new) */}
        {activeTab === 'products/new' && (
          <AddNewProductPage
            onNavigateBack={() => {
              setPrefilledBarcodeForNewProduct({ barcode: '', format: '' });
              setPrefilledHierarchyForNewProduct({ category: '', subcategory: '', selectCategory: '' });
              setPrefilledProductName('');
              setProductSearch('');
              setProductBrandFilter('all');
              setProductCategoryFilter('all');
              setProductCurrentPage(1);
              setShowProductSuccess(true);
              setTimeout(() => setShowProductSuccess(false), 4000);
              navigateToTab('products');
            }}
            initialProductName={prefilledProductName}
            initialBarcode={prefilledBarcodeForNewProduct.barcode}
            initialBarcodeFormat={prefilledBarcodeForNewProduct.format}
            initialCategory={prefilledHierarchyForNewProduct.category}
            initialSubcategory={prefilledHierarchyForNewProduct.subcategory}
            initialSelectCategory={prefilledHierarchyForNewProduct.selectCategory}
          />
        )}

        {/* 5B-2. BULK PRODUCT ENTRY DEDICATED FULL-PAGE ROUTE (/admin/products/bulk) */}
        {activeTab === 'products/bulk' && (
          <BulkProductEntryModal
            isOpen={true}
            isPageMode={true}
            onClose={() => navigateToTab('products')}
            onNavigateToProducts={() => navigateToTab('products')}
            categories={categories}
            brands={brands}
            existingProducts={products}
            onUploadProductImage={uploadProductImage}
            defaultPricingRules={pricingRules}
            onSubmitBulk={async (validRows, onProgress) => {
              if (saveBulkProducts) {
                const res = await saveBulkProducts(validRows, onProgress);
                setDashboardToast({
                  type: 'success',
                  message: `Successfully imported ${res?.count || validRows.length} products! All items are now active in the Products catalog.`
                });
              }
              setShowProductSuccess(true);
              navigateToTab('products');
            }}
          />
        )}

        {/* 5C. UNIVERSAL ATTRIBUTE MASTER & CATEGORY ATTRIBUTES MAPPING */}
        {activeTab === 'attributes' && (
          <AttributesMasterPage categories={categories} />
        )}

                {/* 5E. CUSTOMER SEARCH REQUESTS TRACKING PAGE */}
        {activeTab === 'search_requests' && (
          <CustomerSearchRequestsPage
            onNavigateToNewProduct={(productName) => {
              setPrefilledProductName(productName || '');
              navigateToTab('products/new');
            }}
          />
        )}

        {/* 5D. APPROVAL CENTER PAGE */}
        {activeTab === 'approval_center' && (
          <ApprovalCenterPage
            onNavigate={navigateToTab}
          />
        )}

        {/* 5E. AUDIT TRAIL PAGE */}
        {activeTab === 'audit_trail' && (
          <AuditTrailPage
            onNavigate={navigateToTab}
          />
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

            {/* Product Directory Table Container - Redesigned Products Catalog Matrix */}
            <ProductsCatalogMatrix
              filteredProducts={filteredProducts}
              catalogViewMode={catalogViewMode}
              setCatalogViewMode={setCatalogViewMode}
              handleOpenAddProduct={handleOpenAddProduct}
              handleOpenBulkAdd={() => navigateToTab('products/bulk')}
              productSearch={productSearch}
              setProductSearch={setProductSearch}
              productCurrentPage={productCurrentPage}
              setProductCurrentPage={setProductCurrentPage}
              setIsCatalogScannerOpen={setIsCatalogScannerOpen}
              availableProductBrands={availableProductBrands}
              productBrandFilter={productBrandFilter}
              setProductBrandFilter={setProductBrandFilter}
              availableProductCategories={availableProductCategories}
              productCategoryFilter={productCategoryFilter}
              setProductCategoryFilter={setProductCategoryFilter}
              paginatedProducts={paginatedProducts}
              isBarcodeQuery={isBarcodeQuery}
              handleAddProductWithBarcode={handleAddProductWithBarcode}
              products={products}
              editingProductId={editingProductId}
              expandedProductIds={expandedProductIds}
              toggleExpandProduct={toggleExpandProduct}
              editingTiersProductId={editingTiersProductId}
              setEditingTiersProductId={setEditingTiersProductId}
              editingShadeProductId={editingShadeProductId}
              setEditingShadeProductId={setEditingShadeProductId}
              editingRichDataProductId={editingRichDataProductId}
              setEditingRichDataProductId={setEditingRichDataProductId}
              getTotalQuantityTiersCount={getTotalQuantityTiersCount}
              handleToggleProductTiersPanel={handleToggleProductTiersPanel}
              handleToggleProductShadesPanel={handleToggleProductShadesPanel}
              editPrices={editPrices}
              setEditPrices={setEditPrices}
              handleSavePrices={handleSavePrices}
              handleOpenEditProduct={handleOpenEditProduct}
              handleStartEditProduct={handleStartEditProduct}
              handleOpenDeleteProduct={handleOpenDeleteProduct}
              productTiersLocal={productTiersLocal}
              setProductTiersLocal={setProductTiersLocal}
              isSavingTiers={isSavingTiers}
              handleSaveProductTiers={handleSaveProductTiers}
              tiersSaveSuccess={tiersSaveSuccess}
              productShadesLocal={productShadesLocal}
              setProductShadesLocal={setProductShadesLocal}
              handleSaveProductShades={handleSaveProductShades}
              isSavingShades={isSavingShades}
              shadesSaveSuccess={shadesSaveSuccess}
              handleOpenShadePricing={handleOpenShadePricing}
              shadeFormDraft={shadeFormDraft}
              setShadeFormDraft={setShadeFormDraft}
              updateProduct={updateProduct}
              productRecordsPerPage={productRecordsPerPage}
              setProductRecordsPerPage={setProductRecordsPerPage}
              productStartIndex={productStartIndex}
              totalProductPages={totalProductPages}
              effectiveProductPage={effectiveProductPage}
              brands={brands}
            />

            {/* Catalog Universal Barcode Scanner Modal (Search Mode) */}
            <BarcodeScannerModal
              isOpen={isCatalogScannerOpen}
              onClose={() => setIsCatalogScannerOpen(false)}
              mode="search"
              title="Scan Barcode to Find Product"
              subtitle="Align any 1D or 2D retail product barcode (EAN, UPC, Code-128, QR) within frame"
              onScanSuccess={handleCatalogBarcodeScan}
            />

            {/* Product Not Found Modal (legacy fallback — superseded by BarcodeSearchResultModal) */}
            {productNotFoundModal.isOpen && (
              <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fade-in">
                <div className="bg-white rounded-3xl border border-pink-100 shadow-2xl w-full max-w-md p-6 space-y-4 animate-scale-in text-center">
                  <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 border border-amber-200/70 flex items-center justify-center mx-auto shadow-2xs">
                    <ScanBarcode size={28} />
                  </div>

                  <div>
                    <h3 className="text-lg font-black text-gray-900">Product not found</h3>
                    <p className="text-xs text-gray-600 mt-2 font-medium leading-relaxed">
                      Product not found. Do you want to add this barcode as a new product?
                    </p>
                    <div className="mt-3 p-3 bg-gray-50 rounded-2xl border border-gray-200/80 inline-block font-mono text-sm font-black text-gray-900">
                      {productNotFoundModal.barcode}
                      {productNotFoundModal.format && (
                        <span className="block text-[10px] text-gray-400 font-sans font-semibold mt-0.5">
                          Format: {productNotFoundModal.format}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-center gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setProductNotFoundModal({ isOpen: false, barcode: '', format: '' })}
                      className="px-4 py-2.5 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 text-xs font-bold transition-all cursor-pointer shadow-2xs"
                    >
                      Close
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAddProductWithBarcode(productNotFoundModal.barcode, productNotFoundModal.format)}
                      className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#C2477A] to-[#E25586] hover:from-[#b83760] hover:to-[#C2477A] text-white text-xs font-black shadow-xs transition-all active:scale-95 cursor-pointer flex items-center gap-1.5"
                    >
                      <PlusCircle size={15} />
                      <span>Add Product</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Barcode Search Result Modal */}
            <BarcodeSearchResultModal
              isOpen={barcodeSearchResultModal.isOpen}
              onClose={() => setBarcodeSearchResultModal(prev => ({ ...prev, isOpen: false }))}
              barcode={barcodeSearchResultModal.barcode}
              barcodeFormat={barcodeSearchResultModal.barcodeFormat}
              searchResult={barcodeSearchResultModal.searchResult}
              isSearching={barcodeSearchResultModal.isSearching}
              searchError={barcodeSearchResultModal.searchError}
              onViewProduct={handleViewProductFromBarcode}
              onEditProduct={handleEditProductFromBarcode}
              onAddProduct={(bc, fmt) => handleAddProductWithBarcode(bc, fmt)}
              onScanAgain={() => {
                setBarcodeSearchResultModal(prev => ({ ...prev, isOpen: false }));
                setTimeout(() => setIsCatalogScannerOpen(true), 200);
              }}
              brands={brands}
            />
          </div>
        )}

        {/* 6. USER PAGE */}
        {(activeTab === 'user' || activeTab.startsWith('user/') || activeTab.startsWith('users')) && (
          <div className="space-y-6 animate-fade-in">
            {/* Top Customer Category Tabs: B2C Users vs B2B Users */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-pink-100/80 shadow-xs">
              <div className="flex items-center gap-2 p-1 bg-pink-50/70 rounded-xl border border-pink-100">
                <button
                  onClick={() => {
                    navigateToTab('users/b2c');
                    setUserCurrentPage(1);
                  }}
                  className={`px-4 py-2 rounded-lg font-black text-xs transition-all flex items-center gap-2 cursor-pointer ${
                    !isB2BUserView
                      ? 'bg-[#C2477A] text-white shadow-xs'
                      : 'text-gray-600 hover:text-[#C2477A] hover:bg-white/60'
                  }`}
                >
                  <User size={14} />
                  <span>B2C Users (General)</span>
                  <span className={`text-[10px] font-bold px-2 py-0.2 rounded-full ${!isB2BUserView ? 'bg-white text-[#C2477A]' : 'bg-pink-100 text-[#C2477A]'}`}>
                    {b2cUsersCount}
                  </span>
                </button>

                <button
                  onClick={() => {
                    navigateToTab('users/b2b');
                    setUserCurrentPage(1);
                  }}
                  className={`px-4 py-2 rounded-lg font-black text-xs transition-all flex items-center gap-2 cursor-pointer ${
                    isB2BUserView
                      ? 'bg-[#C2477A] text-white shadow-xs'
                      : 'text-gray-600 hover:text-[#C2477A] hover:bg-white/60'
                  }`}
                >
                  <Building2 size={14} />
                  <span>B2B Users (Salon, Artist, Beautician)</span>
                  <span className={`text-[10px] font-bold px-2 py-0.2 rounded-full ${isB2BUserView ? 'bg-white text-[#C2477A]' : 'bg-purple-100 text-purple-700'}`}>
                    {b2bUsersCount}
                  </span>
                </button>
              </div>

              <div className="flex items-center gap-2 text-xs font-bold text-gray-500 bg-[#FFF5F8] px-4 py-2 rounded-xl border border-pink-100">
                <Users size={15} className="text-[#C2477A]" />
                <span>
                  Total Registered: <strong className="text-gray-900 font-black">{users.length}</strong>
                </span>
              </div>
            </div>

            {/* B2B Users Management View */}
            {isB2BUserView ? (
              <div className="space-y-4">
                {/* Notice & Verification Workflow Header Card */}
                <div className="bg-gradient-to-r from-purple-50/80 via-pink-50/50 to-white p-4 rounded-2xl border border-purple-100/80 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 shadow-2xs">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center shrink-0 border border-purple-200">
                      <Building2 size={18} />
                    </div>
                    <div>
                      <h3 className="text-xs font-black text-purple-900 uppercase tracking-wider flex items-center gap-2">
                        <span>B2B Customer Accounts</span>
                        <span className="text-[10px] px-2 py-0.2 rounded-full bg-purple-200 text-purple-800 normal-case font-bold">
                          Salon • Makeup Artist • Beautician
                        </span>
                      </h3>
                      <p className="text-xs text-gray-600 mt-0.5">
                        Role indicates customer type. <strong>B2B Wholesale Pricing is only activated when Admin approves verification</strong> (<code className="text-[#C2477A] font-bold">b2b_verified = true</code>).
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => navigateToTab('b2b-verification')}
                    className="px-3.5 py-2 rounded-xl bg-[#C2477A] text-white text-xs font-bold hover:bg-[#a63563] transition-all flex items-center gap-1.5 shrink-0 shadow-2xs cursor-pointer"
                  >
                    <ShieldCheck size={14} />
                    <span>Open Verification Queue</span>
                    {b2bPendingTotal > 0 && (
                      <span className="px-1.5 py-0.2 text-[10px] font-black rounded-full bg-amber-400 text-amber-950">
                        {b2bPendingTotal}
                      </span>
                    )}
                  </button>
                </div>

                {/* B2B Filters Bar */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-2xl border border-pink-100/70 shadow-xs">
                  <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
                    <div className="flex items-center gap-2 bg-[#FFF5F8] px-3.5 py-2 rounded-xl border border-pink-100 flex-1 sm:flex-initial min-w-[220px]">
                      <Search size={14} className="text-[#C2477A]" />
                      <input
                        type="text"
                        placeholder="Search B2B name, phone, business, city..."
                        value={userSearchTerm}
                        onChange={(e) => {
                          setUserSearchTerm(e.target.value);
                          setUserCurrentPage(1);
                        }}
                        className="bg-transparent text-xs outline-none text-gray-900 placeholder-gray-400 font-medium w-full"
                      />
                      {userSearchTerm && (
                        <button
                          onClick={() => {
                            setUserSearchTerm('');
                            setUserCurrentPage(1);
                          }}
                          className="text-gray-400 hover:text-gray-600 cursor-pointer"
                        >
                          <X size={12} />
                        </button>
                      )}
                    </div>

                    {/* B2B Type Filter */}
                    <div className="flex items-center gap-2">
                      <Filter size={14} className="text-[#C2477A]" />
                      <span className="text-xs font-semibold text-gray-700">Type:</span>
                      <select
                        value={b2bTypeFilter}
                        onChange={(e) => {
                          setB2bTypeFilter(e.target.value);
                          setUserCurrentPage(1);
                        }}
                        className="px-3.5 py-2 rounded-xl text-xs font-bold bg-[#FFF5F8] border border-pink-100 text-[#C2477A] outline-none cursor-pointer"
                      >
                        <option value="all">All B2B Types</option>
                        <option value="salon">Salon</option>
                        <option value="artist">Makeup Artist</option>
                        <option value="beautician">Beautician</option>
                      </select>
                    </div>

                    {/* Verification Status Filter */}
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-gray-700">Verification:</span>
                      <select
                        value={b2bVerificationStatusFilter}
                        onChange={(e) => {
                          setB2bVerificationStatusFilter(e.target.value);
                          setUserCurrentPage(1);
                        }}
                        className="px-3.5 py-2 rounded-xl text-xs font-bold bg-[#FFF5F8] border border-pink-100 text-[#C2477A] outline-none cursor-pointer"
                      >
                        <option value="all">All Statuses</option>
                        <option value="pending">Pending</option>
                        <option value="under_review">Under Review</option>
                        <option value="approved">Approved</option>
                        <option value="rejected">Rejected</option>
                        <option value="resubmission_required">Resubmission Required</option>
                        <option value="suspended">Suspended</option>
                      </select>
                    </div>

                    {(userSearchTerm || b2bTypeFilter !== 'all' || b2bVerificationStatusFilter !== 'all') && (
                      <button
                        onClick={() => {
                          setUserSearchTerm('');
                          setB2bTypeFilter('all');
                          setB2bVerificationStatusFilter('all');
                          setUserCurrentPage(1);
                        }}
                        className="text-xs font-bold text-[#C2477A] hover:underline cursor-pointer"
                      >
                        Reset Filters
                      </button>
                    )}
                  </div>
                </div>

                {/* B2B Users Table */}
                <div className="bg-white rounded-2xl border border-pink-100/70 shadow-xs overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-[#FFF2F5] text-gray-900 uppercase font-black text-[11px] tracking-wider border-b border-pink-100/80">
                        <tr>
                          <th className="py-4 px-5">Customer Name</th>
                          <th className="py-4 px-5">Professional / Business</th>
                          <th className="py-4 px-4">B2B Type</th>
                          <th className="py-4 px-5">Contact</th>
                          <th className="py-4 px-4">City</th>
                          <th className="py-4 px-4">Verification Status</th>
                          <th className="py-4 px-4">B2B Status</th>
                          <th className="py-4 px-4">Registered Date</th>
                          <th className="py-4 px-5 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {paginatedUsers.length === 0 ? (
                          <tr>
                            <td colSpan={9} className="py-12 px-6 text-center text-gray-400">
                              <Building2 size={32} className="mx-auto mb-2 text-gray-300" />
                              <p className="font-bold text-sm text-gray-600">No B2B accounts found</p>
                              <p className="text-xs text-gray-400 mt-0.5">
                                Try adjusting your search query, B2B type, or verification status filter.
                              </p>
                            </td>
                          </tr>
                        ) : (
                          paginatedUsers.map((u) => {
                            const meta = parseUserMeta(u);
                            const matchingV = (b2bVerifications || []).find(v => v.user_id === u.id || v.userId === u.id);
                            const initial = (u.name || 'U').trim().charAt(0).toUpperCase();

                            const vStatus = (matchingV?.verification_status || u.verificationStatus || 'not_submitted').toLowerCase();
                            const isVerifiedB2B = (vStatus === 'approved' && (u.b2bVerified === true || matchingV?.b2b_verified === true));

                            const typeLabel = u.role === 'salon' ? 'Salon' : (u.role === 'artist' ? 'Makeup Artist' : (u.role === 'beautician' ? 'Beautician' : u.role));
                            const typeBadgeClass = {
                              salon: 'bg-pink-100 text-[#C2477A] border-pink-200',
                              artist: 'bg-blue-100 text-blue-700 border-blue-200',
                              beautician: 'bg-emerald-100 text-emerald-700 border-emerald-200'
                            }[u.role?.toLowerCase()] || 'bg-gray-100 text-gray-700 border-gray-200';

                            const statusBadge = {
                              submitted: <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">Pending</span>,
                              pending: <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">Pending</span>,
                              under_review: <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-200">Under Review</span>,
                              approved: <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">Approved</span>,
                              rejected: <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200">Rejected</span>,
                              resubmission_required: <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-orange-100 text-orange-800 border border-orange-200">Resubmission Required</span>,
                              suspended: <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-900 border border-red-300">Suspended</span>,
                              not_submitted: <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-gray-100 text-gray-600 border border-gray-200">Not Submitted</span>
                            }[vStatus] || <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-gray-100 text-gray-600 border border-gray-200">{vStatus}</span>;

                            const regDateStr = u.createdAt || u.lastActive
                              ? new Date(u.createdAt || u.lastActive).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
                              : '—';

                            return (
                              <tr key={u.id} className="hover:bg-gray-50/60 transition-colors">
                                {/* Customer Name */}
                                <td className="py-3.5 px-5">
                                  <div className="flex items-center gap-3">
                                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-pink-400 to-[#C2477A] text-white flex items-center justify-center font-black text-xs shadow-xs shrink-0">
                                      {initial}
                                    </div>
                                    <div>
                                      <div className="font-extrabold text-sm text-gray-900 leading-snug">
                                        {u.fullName || u.name || 'Unnamed Customer'}
                                      </div>
                                      <div className="text-[10px] text-gray-400 font-mono">
                                        ID: {String(u.id).replace(/^u_/, '')}
                                      </div>
                                    </div>
                                  </div>
                                </td>

                                {/* Professional / Business Name */}
                                <td className="py-3.5 px-5">
                                  <div className="font-bold text-gray-800 flex items-center gap-1.5">
                                    <Store size={13} className="text-[#C2477A] shrink-0" />
                                    <span>{matchingV?.business_name || u.businessName || '—'}</span>
                                  </div>
                                  {matchingV?.gstin && (
                                    <div className="text-[10px] text-gray-400 font-mono mt-0.5">
                                      GST: {matchingV.gstin}
                                    </div>
                                  )}
                                </td>

                                {/* B2B Type */}
                                <td className="py-3.5 px-4">
                                  <span className={`inline-block font-extrabold text-[10.5px] px-2.5 py-0.5 rounded-lg border uppercase tracking-wider ${typeBadgeClass}`}>
                                    {typeLabel}
                                  </span>
                                </td>

                                {/* Phone & Email */}
                                <td className="py-3.5 px-5">
                                  <div className="flex items-center gap-1.5 text-xs text-gray-700 font-semibold">
                                    <Phone size={11} className="text-gray-400" />
                                    <span>{u.phone || 'No phone'}</span>
                                  </div>
                                  {(u.email || meta.email) && (
                                    <div className="flex items-center gap-1.5 text-[11px] text-gray-400 font-medium mt-0.5 truncate max-w-[150px]">
                                      <Mail size={11} className="text-gray-400 shrink-0" />
                                      <span className="truncate">{u.email || meta.email}</span>
                                    </div>
                                  )}
                                </td>

                                {/* City */}
                                <td className="py-3.5 px-4 font-semibold text-gray-700">
                                  {matchingV?.city || meta.city || '—'}
                                </td>

                                {/* Verification Status */}
                                <td className="py-3.5 px-4">
                                  {statusBadge}
                                </td>

                                {/* B2B Status (✓ Verified B2B vs Not Verified) */}
                                <td className="py-3.5 px-4">
                                  {isVerifiedB2B ? (
                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-black bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-2xs">
                                      <CheckCircle2 size={12} className="text-emerald-600" />
                                      ✓ Verified B2B
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-gray-100 text-gray-500 border border-gray-200">
                                      Not Verified
                                    </span>
                                  )}
                                </td>

                                {/* Registered Date */}
                                <td className="py-3.5 px-4 text-gray-500 font-medium whitespace-nowrap">
                                  {regDateStr}
                                </td>

                                {/* Actions */}
                                <td className="py-3.5 px-5 text-right whitespace-nowrap">
                                  <div className="flex items-center justify-end gap-1.5">
                                    <button
                                      onClick={() => setSelectedUserDetails(u)}
                                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-pink-200 bg-white hover:bg-pink-50 text-[#C2477A] font-bold text-xs shadow-2xs transition-all cursor-pointer"
                                      title="View Customer Profile"
                                    >
                                      <Info size={12} />
                                      <span>Details</span>
                                    </button>
                                    <button
                                      onClick={() => {
                                        const roleRoute = u.role === 'salon' ? 'b2b-verification/salon' : (u.role === 'artist' ? 'b2b-verification/makeup-artist' : (u.role === 'beautician' ? 'b2b-verification/beautician' : 'b2b-verification'));
                                        navigateToTab(roleRoute);
                                      }}
                                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#C2477A] text-white hover:bg-[#a63563] font-bold text-xs shadow-2xs transition-all cursor-pointer"
                                      title="Inspect Verification Application"
                                    >
                                      <ShieldCheck size={12} />
                                      <span>Verify</span>
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination Controls */}
                  <div className="bg-[#FFF8FA] px-6 py-4 border-t border-pink-100 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-semibold text-gray-600">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        <span className="text-gray-500 font-medium">Rows per page:</span>
                        <select
                          value={userRecordsPerPage}
                          onChange={(e) => {
                            setUserRecordsPerPage(Number(e.target.value));
                            setUserCurrentPage(1);
                          }}
                          className="px-2.5 py-1.5 rounded-lg border border-pink-200 bg-white text-gray-800 font-bold outline-none cursor-pointer focus:border-[#C2477A]"
                        >
                          <option value={15}>15</option>
                          <option value={20}>20</option>
                          <option value={30}>30</option>
                          <option value={40}>40</option>
                          <option value={50}>50</option>
                        </select>
                      </div>

                      <span className="text-gray-400">|</span>

                      <span>
                        Showing <strong className="text-gray-900 font-bold">{filteredB2BUsers.length === 0 ? 0 : userStartIndex + 1}</strong> - <strong className="text-gray-900 font-bold">{Math.min(userStartIndex + userRecordsPerPage, filteredB2BUsers.length)}</strong> of <strong className="text-gray-900 font-bold">{filteredB2BUsers.length}</strong>
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => setUserCurrentPage((p) => Math.max(1, p - 1))}
                        disabled={userCurrentPage <= 1}
                        className={`p-2 rounded-xl border flex items-center justify-center transition-all ${userCurrentPage <= 1 ? 'border-gray-200 text-gray-300 cursor-not-allowed bg-gray-50' : 'border-pink-200 text-[#C2477A] bg-white hover:bg-pink-50 cursor-pointer shadow-2xs'}`}
                        title="Previous Page"
                      >
                        <ChevronLeft size={16} />
                      </button>
                      <span className="px-3 py-1 text-xs font-bold text-gray-700 bg-white border border-pink-200 rounded-xl">
                        Page {effectiveUserPage} of {totalUserPages}
                      </span>
                      <button
                        onClick={() => setUserCurrentPage((p) => Math.min(totalUserPages, p + 1))}
                        disabled={userCurrentPage >= totalUserPages}
                        className={`p-2 rounded-xl border flex items-center justify-center transition-all ${userCurrentPage >= totalUserPages ? 'border-gray-200 text-gray-300 cursor-not-allowed bg-gray-50' : 'border-pink-200 text-[#C2477A] bg-white hover:bg-pink-50 cursor-pointer shadow-2xs'}`}
                        title="Next Page"
                      >
                        <ChevronRight size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              /* B2C Users Management View (General Users) */
              <div className="space-y-4">
                {/* B2C Info Banner */}
                <div className="bg-gradient-to-r from-pink-50/80 via-white to-pink-50/40 p-4 rounded-2xl border border-pink-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-2xs">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-pink-100 text-[#C2477A] flex items-center justify-center shrink-0 border border-pink-200">
                      <User size={18} />
                    </div>
                    <div>
                      <h3 className="text-xs font-black text-gray-900 uppercase tracking-wider flex items-center gap-2">
                        <span>General User (B2C) Accounts</span>
                        <span className="text-[10px] px-2 py-0.2 rounded-full bg-pink-100 text-[#C2477A] font-bold normal-case">
                          Standard Retail Customer
                        </span>
                      </h3>
                      <p className="text-xs text-gray-600 mt-0.5">
                        B2C customers shop immediately at standard retail pricing. <strong>No professional verification is required.</strong>
                      </p>
                    </div>
                  </div>
                  <div className="text-xs font-bold text-gray-500 bg-white px-3 py-1.5 rounded-xl border border-pink-100 shrink-0">
                    Pricing Mode: <strong className="text-[#C2477A]">General Retail</strong>
                  </div>
                </div>

                {/* B2C Search Control Bar */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-2xl border border-pink-100/70 shadow-xs">
                  <div className="flex items-center gap-2 bg-[#FFF5F8] px-3.5 py-2 rounded-xl border border-pink-100 w-full sm:w-auto min-w-[280px]">
                    <Search size={14} className="text-[#C2477A]" />
                    <input
                      type="text"
                      placeholder="Search general customer name, phone, email, city..."
                      value={userSearchTerm}
                      onChange={(e) => {
                        setUserSearchTerm(e.target.value);
                        setUserCurrentPage(1);
                      }}
                      className="bg-transparent text-xs outline-none text-gray-900 placeholder-gray-400 font-medium w-full"
                    />
                    {userSearchTerm && (
                      <button
                        onClick={() => {
                          setUserSearchTerm('');
                          setUserCurrentPage(1);
                        }}
                        className="text-gray-400 hover:text-gray-600 cursor-pointer"
                      >
                        <X size={12} />
                      </button>
                    )}
                  </div>

                  <div className="text-xs font-semibold text-gray-500">
                    Showing <strong className="text-gray-900 font-bold">{filteredB2CUsers.length}</strong> General Retail Customers
                  </div>
                </div>

                {/* B2C Users Table */}
                <div className="bg-white rounded-2xl border border-pink-100/70 shadow-xs overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-[#FFF2F5] text-gray-900 uppercase font-black text-[11px] tracking-wider border-b border-pink-100/80">
                        <tr>
                          <th className="py-4 px-6 min-w-[240px]">Customer Details</th>
                          <th className="py-4 px-6 min-w-[180px]">Contact & Email</th>
                          <th className="py-4 px-6 min-w-[150px]">City & State</th>
                          <th className="py-4 px-6 min-w-[140px]">Pricing Mode</th>
                          <th className="py-4 px-6 min-w-[140px]">Registered Date</th>
                          <th className="py-4 px-6 text-right min-w-[120px]">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {paginatedUsers.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="py-12 px-6 text-center text-gray-400">
                              <User size={32} className="mx-auto mb-2 text-gray-300" />
                              <p className="font-bold text-sm text-gray-600">No B2C general users found</p>
                              <p className="text-xs text-gray-400 mt-0.5">
                                Try adjusting your search query.
                              </p>
                            </td>
                          </tr>
                        ) : (
                          paginatedUsers.map((u) => {
                            const meta = parseUserMeta(u);
                            const initial = (u.name || 'U').trim().charAt(0).toUpperCase();
                            const regDateStr = u.createdAt || u.lastActive
                              ? new Date(u.createdAt || u.lastActive).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
                              : '—';

                            return (
                              <tr key={u.id} className="hover:bg-gray-50/60 transition-colors">
                                {/* Customer Details */}
                                <td className="py-4 px-6">
                                  <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-400 to-[#C2477A] text-white flex items-center justify-center font-black text-sm shadow-xs shrink-0">
                                      {initial}
                                    </div>
                                    <div>
                                      <div className="font-extrabold text-sm text-gray-900 leading-snug">
                                        {u.fullName || u.name || 'Unnamed Customer'}
                                      </div>
                                      <div className="text-[10px] text-gray-400 font-mono">
                                        ID: {String(u.id).replace(/^u_/, '')}
                                      </div>
                                    </div>
                                  </div>
                                </td>

                                {/* Contact & Email */}
                                <td className="py-4 px-6">
                                  <div className="flex items-center gap-1.5 text-xs text-gray-700 font-semibold">
                                    <Phone size={11} className="text-gray-400" />
                                    <span>{u.phone || 'No phone'}</span>
                                  </div>
                                  {(u.email || meta.email) && (
                                    <div className="flex items-center gap-1.5 text-[11px] text-gray-400 font-medium mt-0.5">
                                      <Mail size={11} className="text-gray-400 shrink-0" />
                                      <span>{u.email || meta.email}</span>
                                    </div>
                                  )}
                                </td>

                                {/* City & State */}
                                <td className="py-4 px-6">
                                  <div className="font-semibold text-gray-800">
                                    {meta.city || '—'}
                                  </div>
                                  {meta.state && (
                                    <div className="text-[11px] text-gray-400">
                                      {meta.state} {meta.pincode ? `(${meta.pincode})` : ''}
                                    </div>
                                  )}
                                </td>

                                {/* Pricing Mode */}
                                <td className="py-4 px-6">
                                  <span className="inline-block font-extrabold text-[11px] px-2.5 py-1 rounded-lg border uppercase tracking-wider bg-pink-50 text-[#C2477A] border-pink-200">
                                    General Retail
                                  </span>
                                </td>

                                {/* Registered Date */}
                                <td className="py-4 px-6 text-gray-500 font-medium">
                                  {regDateStr}
                                </td>

                                {/* Action */}
                                <td className="py-4 px-6 text-right">
                                  <button
                                    onClick={() => setSelectedUserDetails(u)}
                                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-pink-200 bg-white hover:bg-[#FFF5F8] hover:border-[#C2477A] text-[#C2477A] font-black text-xs shadow-2xs transition-all cursor-pointer group active:scale-95"
                                    title="View Customer Profile"
                                  >
                                    <Info size={14} className="text-[#C2477A] group-hover:scale-110 transition-transform" />
                                    <span>View Details</span>
                                  </button>
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination Controls */}
                  <div className="bg-[#FFF8FA] px-6 py-4 border-t border-pink-100 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-semibold text-gray-600">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        <span className="text-gray-500 font-medium">Rows per page:</span>
                        <select
                          value={userRecordsPerPage}
                          onChange={(e) => {
                            setUserRecordsPerPage(Number(e.target.value));
                            setUserCurrentPage(1);
                          }}
                          className="px-2.5 py-1.5 rounded-lg border border-pink-200 bg-white text-gray-800 font-bold outline-none cursor-pointer focus:border-[#C2477A]"
                        >
                          <option value={15}>15</option>
                          <option value={20}>20</option>
                          <option value={30}>30</option>
                          <option value={40}>40</option>
                          <option value={50}>50</option>
                        </select>
                      </div>

                      <span className="text-gray-400">|</span>

                      <span>
                        Showing <strong className="text-gray-900 font-bold">{filteredB2CUsers.length === 0 ? 0 : userStartIndex + 1}</strong> - <strong className="text-gray-900 font-bold">{Math.min(userStartIndex + userRecordsPerPage, filteredB2CUsers.length)}</strong> of <strong className="text-gray-900 font-bold">{filteredB2CUsers.length}</strong>
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => setUserCurrentPage((p) => Math.max(1, p - 1))}
                        disabled={userCurrentPage <= 1}
                        className={`p-2 rounded-xl border flex items-center justify-center transition-all ${userCurrentPage <= 1 ? 'border-gray-200 text-gray-300 cursor-not-allowed bg-gray-50' : 'border-pink-200 text-[#C2477A] bg-white hover:bg-pink-50 cursor-pointer shadow-2xs'}`}
                        title="Previous Page"
                      >
                        <ChevronLeft size={16} />
                      </button>
                      <span className="px-3 py-1 text-xs font-bold text-gray-700 bg-white border border-pink-200 rounded-xl">
                        Page {effectiveUserPage} of {totalUserPages}
                      </span>
                      <button
                        onClick={() => setUserCurrentPage((p) => Math.min(totalUserPages, p + 1))}
                        disabled={userCurrentPage >= totalUserPages}
                        className={`p-2 rounded-xl border flex items-center justify-center transition-all ${userCurrentPage >= totalUserPages ? 'border-gray-200 text-gray-300 cursor-not-allowed bg-gray-50' : 'border-pink-200 text-[#C2477A] bg-white hover:bg-pink-50 cursor-pointer shadow-2xs'}`}
                        title="Next Page"
                      >
                        <ChevronRight size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Premium User Details Modal */}
            {selectedUserDetails && (() => {
              const meta = parseUserMeta(selectedUserDetails);
              const userOrders = orders.filter(
                (o) => o.phone === selectedUserDetails.phone || o.userName === selectedUserDetails.name
              );
              const totalSpent = userOrders.reduce((sum, o) => sum + (Number(o.totalAmount) || 0), 0);
              const isFlagged = (selectedUserDetails.cancellationCount || 0) >= 3;
              const initial = (selectedUserDetails.name || 'U').trim().charAt(0).toUpperCase();

              return (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fade-in">
                  <div className="bg-white rounded-3xl border border-pink-100 shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto animate-scale-up">
                    {/* Modal Header */}
                    <div className="p-6 bg-gradient-to-r from-[#FFF2F5] via-white to-[#FFF5F8] border-b border-pink-100 flex items-start justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-pink-400 to-[#C2477A] text-white flex items-center justify-center font-black text-xl shadow-md">
                          {initial}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h2 className="text-xl font-extrabold text-gray-900">
                              {selectedUserDetails.name || 'Customer'}
                            </h2>
                            <span className="font-extrabold text-[10px] uppercase px-2.5 py-0.5 rounded-full bg-[#C2477A] text-white shadow-2xs">
                              {meta.roleLabel}
                            </span>
                          </div>
                          <p className="text-xs text-gray-500 font-medium mt-1">
                            User ID: <span className="font-mono text-gray-700 font-bold">{selectedUserDetails.id}</span>
                          </p>
                        </div>
                      </div>

                      <button
                        onClick={() => setSelectedUserDetails(null)}
                        className="w-9 h-9 rounded-full bg-white border border-gray-200 hover:bg-gray-100 text-gray-500 flex items-center justify-center transition-colors cursor-pointer"
                        title="Close"
                      >
                        <X size={16} />
                      </button>
                    </div>

                    {/* Modal Body */}
                    <div className="p-6 space-y-6 text-xs">
                      {/* Section 1: Contact & Personal Info */}
                      <div>
                        <h3 className="font-black text-gray-900 uppercase text-[11px] tracking-wider mb-3 flex items-center gap-1.5 text-[#C2477A]">
                          <User size={14} /> Personal & Contact Details
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-[#FDF8FA] p-4 rounded-2xl border border-pink-100/70">
                          <div>
                            <span className="text-[10px] uppercase font-bold text-gray-400 block">Full Name</span>
                            <span className="font-extrabold text-sm text-gray-900 mt-0.5 block">
                              {selectedUserDetails.name || 'Not provided'}
                            </span>
                          </div>

                          <div>
                            <span className="text-[10px] uppercase font-bold text-gray-400 block">Mobile Number</span>
                            <a
                              href={`tel:${selectedUserDetails.phone}`}
                              className="font-extrabold text-sm text-[#C2477A] hover:underline mt-0.5 flex items-center gap-1"
                            >
                              <Phone size={13} /> {selectedUserDetails.phone || 'Not provided'}
                            </a>
                          </div>

                          <div>
                            <span className="text-[10px] uppercase font-bold text-gray-400 block">Email Address</span>
                            <span className="font-bold text-xs text-gray-800 mt-0.5 block break-all">
                              {meta.email ? (
                                <a href={`mailto:${meta.email}`} className="text-[#C2477A] hover:underline">
                                  {meta.email}
                                </a>
                              ) : (
                                <span className="text-gray-400 font-normal">Not provided</span>
                              )}
                            </span>
                          </div>

                          <div>
                            <span className="text-[10px] uppercase font-bold text-gray-400 block">Account Status</span>
                            <span className="font-extrabold text-xs text-emerald-600 mt-0.5 flex items-center gap-1">
                              <CheckCircle size={14} /> Active Verified Account
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Section 2: Role & Business Information */}
                      <div>
                        <h3 className="font-black text-gray-900 uppercase text-[11px] tracking-wider mb-3 flex items-center gap-1.5 text-[#C2477A]">
                          <Store size={14} /> Role & Business Profile
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-[#FDF8FA] p-4 rounded-2xl border border-pink-100/70">
                          <div>
                            <span className="text-[10px] uppercase font-bold text-gray-400 block">Assigned Role Tier</span>
                            <span className="font-extrabold text-xs text-gray-900 mt-0.5 block">
                              {meta.roleLabel}
                            </span>
                          </div>

                          <div>
                            <span className="text-[10px] uppercase font-bold text-gray-400 block">Business / Salon Name</span>
                            <span className="font-extrabold text-xs text-gray-900 mt-0.5 block">
                              {meta.businessName || <span className="text-gray-400 font-normal">None / Individual Customer</span>}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Section 3: Address & Location Details */}
                      <div>
                        <h3 className="font-black text-gray-900 uppercase text-[11px] tracking-wider mb-3 flex items-center gap-1.5 text-[#C2477A]">
                          <MapPin size={14} /> Address & Location
                        </h3>
                        <div className="bg-[#FDF8FA] p-4 rounded-2xl border border-pink-100/70 space-y-3">
                          <div>
                            <span className="text-[10px] uppercase font-bold text-gray-400 block">Delivery / Profile Address</span>
                            <p className="font-bold text-xs text-gray-800 mt-0.5">
                              {meta.city || meta.state || meta.pincode
                                ? `${meta.city ? meta.city + ', ' : ''}${meta.state || ''}${meta.pincode ? ' - ' + meta.pincode : ''}`
                                : (selectedUserDetails.branch || 'No address provided yet')}
                            </p>
                          </div>

                          <div className="grid grid-cols-3 gap-2 pt-1 border-t border-pink-100/50">
                            <div>
                              <span className="text-[10px] uppercase font-bold text-gray-400 block">City</span>
                              <span className="font-bold text-xs text-gray-800">{meta.city || '—'}</span>
                            </div>
                            <div>
                              <span className="text-[10px] uppercase font-bold text-gray-400 block">State</span>
                              <span className="font-bold text-xs text-gray-800">{meta.state || '—'}</span>
                            </div>
                            <div>
                              <span className="text-[10px] uppercase font-bold text-gray-400 block">PIN Code</span>
                              <span className="font-bold text-xs text-gray-800">{meta.pincode || '—'}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Section 4: Cancellation History & Account Standing */}
                      <div>
                        <h3 className="font-black text-gray-900 uppercase text-[11px] tracking-wider mb-3 flex items-center gap-1.5 text-[#C2477A]">
                          <ShieldAlert size={14} /> Cancellation History & Flags
                        </h3>
                        <div className={`p-4 rounded-2xl border ${isFlagged ? 'bg-red-50/80 border-red-200' : 'bg-emerald-50/70 border-emerald-200'}`}>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2.5">
                              {isFlagged ? (
                                <ShieldAlert size={20} className="text-red-600 shrink-0" />
                              ) : (
                                <CheckCircle size={20} className="text-emerald-600 shrink-0" />
                              )}
                              <div>
                                <span className={`font-black text-xs block ${isFlagged ? 'text-red-900' : 'text-emerald-950'}`}>
                                  {isFlagged
                                    ? 'Cancellation Limit Exceeded (Flagged)'
                                    : 'Good Standing — Clean Account'}
                                </span>
                                <span className={`text-[11px] font-medium block mt-0.5 ${isFlagged ? 'text-red-700' : 'text-emerald-700'}`}>
                                  {isFlagged
                                    ? 'User has reached 3 consecutive cancellations. Cash on Delivery is restricted.'
                                    : `${selectedUserDetails.cancellationCount || 0} of 3 allowable consecutive cancellations used.`}
                                </span>
                              </div>
                            </div>

                            <span className={`px-3 py-1 rounded-full text-xs font-black border ${
                              isFlagged
                                ? 'bg-red-100 text-red-700 border-red-300'
                                : 'bg-emerald-100 text-emerald-800 border-emerald-300'
                            }`}>
                              {selectedUserDetails.cancellationCount || 0} / 3 Cancels
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Section 5: Order Activity Summary */}
                      <div>
                        <h3 className="font-black text-gray-900 uppercase text-[11px] tracking-wider mb-3 flex items-center gap-1.5 text-[#C2477A]">
                          <ShoppingBag size={14} /> Order Activity Summary
                        </h3>
                        <div className="grid grid-cols-2 gap-3 bg-[#FDF8FA] p-4 rounded-2xl border border-pink-100/70">
                          <div>
                            <span className="text-[10px] uppercase font-bold text-gray-400 block">Total Orders Placed</span>
                            <span className="font-black text-lg text-gray-900 mt-0.5 block">
                              {userOrders.length}
                            </span>
                          </div>
                          <div>
                            <span className="text-[10px] uppercase font-bold text-gray-400 block">Total Lifetime Spend</span>
                            <span className="font-black text-lg text-[#C2477A] mt-0.5 block">
                              ₹{totalSpent.toLocaleString('en-IN')}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Modal Footer */}
                    <div className="p-4 bg-gray-50 border-t border-gray-100 flex justify-end">
                      <button
                        onClick={() => setSelectedUserDetails(null)}
                        className="px-6 py-2.5 rounded-xl bg-[#C2477A] hover:bg-[#b83760] text-white font-bold text-xs shadow-xs transition-colors cursor-pointer"
                      >
                        Close Details
                      </button>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        )}

        {/* 7. CANCEL FEE PAGE */}
        {activeTab === 'cancel_fee' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in">
            <div className="bg-white p-6 rounded-2xl border border-pink-100/70 shadow-xs h-fit">
              <h3 className="font-bold text-sm text-gray-900 uppercase mb-4 flex items-center gap-2">
                <DollarSign size={18} className="text-[#C2477A]" /> Cancellation Rules
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
                    min="0"
                    value={feeForm.feeAmount}
                    onChange={(e) => setFeeForm({ ...feeForm, feeAmount: Math.max(0, Number(e.target.value)) })}
                    className="w-full p-3 rounded-xl border border-pink-100 outline-none focus:border-[#C2477A] font-extrabold text-[#C2477A] bg-white"
                  />
                  <span className="text-[10px] text-gray-400 font-medium block mt-1">Deducted or billed after grace period.</span>
                </div>

                <div>
                  <label className="block text-gray-700 font-semibold mb-1">Free Cancellation Window (Minutes)</label>
                  <input
                    type="number"
                    min="0"
                    value={feeForm.graceWindowMinutes}
                    onChange={(e) => setFeeForm({ ...feeForm, graceWindowMinutes: Math.max(0, Number(e.target.value)) })}
                    className="w-full p-3 rounded-xl border border-pink-100 outline-none focus:border-[#C2477A] font-extrabold text-[#C2477A] bg-white"
                  />
                  <span className="text-[10px] text-gray-400 font-medium block mt-1">Customer can edit/cancel free within this window.</span>
                </div>

                <div>
                  <label className="block text-gray-700 font-semibold mb-1">Max Consecutive Cancels Threshold</label>
                  <input
                    type="number"
                    min="1"
                    value={feeForm.maxAllowedCancels}
                    onChange={(e) => setFeeForm({ ...feeForm, maxAllowedCancels: Math.max(1, Number(e.target.value)) })}
                    className="w-full p-3 rounded-xl border border-pink-100 outline-none focus:border-[#C2477A] font-extrabold text-[#C2477A] bg-white"
                  />
                  <span className="text-[10px] text-gray-400 font-medium block mt-1">Triggers Cancellation Warning Modal on customer app.</span>
                </div>

                <button
                  type="submit"
                  className="w-full bg-[#C2477A] text-white py-3 rounded-xl font-bold shadow-xs hover:bg-[#b83760] transition-colors flex items-center justify-center gap-2 mt-2 cursor-pointer"
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
                        <td className="p-3.5 font-bold text-[#C2477A]">{item.id}</td>
                        <td className="p-3.5">
                          <div className="font-bold text-gray-900">{item.userName}</div>
                          <span className="text-[10px] text-gray-400 uppercase font-semibold">{item.userRole}</span>
                        </td>
                        <td className="p-3.5 text-gray-500 font-medium">{item.cancelledAt}</td>
                        <td className="p-3.5 font-extrabold text-[#C2477A] text-sm">₹{item.feeCharged}</td>
                        <td className="p-3.5">
                          <button
                            onClick={() => toggleFeeWaived(item.id)}
                            className={`px-3.5 py-1.5 rounded-xl text-[10px] font-bold border transition-colors cursor-pointer ${item.feeWaived
                                ? 'bg-emerald-50 text-emerald-600 border-emerald-100'
                                : 'bg-[#FFF5F8] text-[#C2477A] border-pink-200 hover:bg-[#FFF5F8]'
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

        {/* 8. PRICING RULES PAGE */}
        {activeTab === 'pricing_rules' && (() => {
          // Use draft if editing, else use saved pricingRules
          const activePR = draftPricingRules || pricingRules;
          const roleDiscounts = activePR?.roleDiscounts || {};
          const quantityTiers = activePR?.quantityTiers || [];

          const computePreviewPrices = () => {
            const mrp = Number(previewMrp) || 0;
            const qty = Number(previewQty) || 1;
            const generalPrice = mrp; // no discount for general user
            const calcRolePrice = (discountPct) => Math.round(mrp * (1 - discountPct / 100));
            const salonBase = calcRolePrice(Number(roleDiscounts.salon) || 0);
            const artistBase = calcRolePrice(Number(roleDiscounts.artist) || 0);
            const beauticianBase = calcRolePrice(Number(roleDiscounts.beautician) || 0);
            const getQtyDiscount = () => {
              let pct = 0;
              for (const tier of quantityTiers) {
                const min = Number(tier.minQty);
                const max = tier.maxQty !== null ? Number(tier.maxQty) : Infinity;
                if (qty >= min && qty <= max) { pct = Number(tier.additionalDiscount) || 0; break; }
              }
              return pct;
            };
            const qtyDiscount = getQtyDiscount();
            const applyQty = (base) => Math.round(base * (1 - qtyDiscount / 100));
            return {
              generalPrice,
              salonBase, salonFinal: applyQty(salonBase),
              artistBase, artistFinal: applyQty(artistBase),
              beauticianBase, beauticianFinal: applyQty(beauticianBase),
              qtyDiscount,
            };
          };
          const preview = computePreviewPrices();

          const handleSavePricingRules = async () => {
            setIsSavingPricingRules(true);
            try {
              await updatePricingRules(activePR);
              setDraftPricingRules(null);
              setShowPricingSuccess(true);
              setTimeout(() => setShowPricingSuccess(false), 3500);
            } catch (e) {
              console.error('Error saving pricing rules:', e);
            } finally {
              setIsSavingPricingRules(false);
            }
          };

          const handleRoleDiscountChange = (role, val) => {
            setDraftPricingRules({
              ...(draftPricingRules || pricingRules),
              roleDiscounts: {
                ...((draftPricingRules || pricingRules).roleDiscounts),
                [role]: Number(val)
              }
            });
          };

          const handleTierChange = (idx, field, val) => {
            const tiers = [...(draftPricingRules || pricingRules).quantityTiers];
            tiers[idx] = { ...tiers[idx], [field]: field === 'additionalDiscount' || field === 'minQty' || field === 'maxQty' ? (val === '' || val === null ? null : Number(val)) : val };
            setDraftPricingRules({ ...(draftPricingRules || pricingRules), quantityTiers: tiers });
          };

          const handleAddTier = () => {
            const tiers = [...(draftPricingRules || pricingRules).quantityTiers];
            const last = tiers[tiers.length - 1];
            const newMin = last ? (last.maxQty !== null ? Number(last.maxQty) + 1 : Number(last.minQty) + 5) : 1;
            tiers.push({ label: `${newMin}+ units`, minQty: newMin, maxQty: null, additionalDiscount: 0 });
            setDraftPricingRules({ ...(draftPricingRules || pricingRules), quantityTiers: tiers });
          };

          const handleRemoveTier = (idx) => {
            const tiers = (draftPricingRules || pricingRules).quantityTiers.filter((_, i) => i !== idx);
            setDraftPricingRules({ ...(draftPricingRules || pricingRules), quantityTiers: tiers });
          };

          const handleResetToDefaults = () => {
            setDraftPricingRules({ ...DEFAULT_PRICING_RULES });
          };

          return (
            <div className="space-y-6 animate-fade-in">
              {/* Success Banner */}
              {showPricingSuccess && (
                <div className="p-4 bg-emerald-50 text-emerald-600 rounded-2xl text-xs font-bold flex items-center justify-between border border-emerald-100 shadow-xs animate-fade-in">
                  <div className="flex items-center gap-2">
                    <CheckCircle size={16} />
                    <span>Pricing rules saved to Supabase — live in Admin Panel and User App!</span>
                  </div>
                  <button onClick={() => setShowPricingSuccess(false)}><X size={14} /></button>
                </div>
              )}

              <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                {/* Left Panel: Role Discounts + Quantity Tiers */}
                <div className="xl:col-span-2 space-y-6">

                  {/* ROLE DISCOUNT CONFIGURATION CARD */}
                  <div className="bg-white p-6 rounded-2xl border border-pink-100/80 shadow-sm">
                    <div className="flex items-center justify-between mb-5 pb-4 border-b border-pink-100/60">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-xl bg-[#FFF5F8] text-[#C2477A] flex items-center justify-center shadow-xs">
                          <Sparkles size={18} />
                        </div>
                        <div>
                          <h3 className="font-extrabold text-sm text-gray-900 tracking-wide uppercase">Role-Based Discount Configuration</h3>
                          <p className="text-[11px] text-gray-400 font-medium mt-0.5">% off MRP → becomes the professional's base price</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-semibold text-amber-600 bg-amber-50 border border-amber-100 px-2.5 py-1 rounded-lg">
                          General Users: no discount
                        </span>
                      </div>
                    </div>

                    {/* Role Pricing Formula Banner */}
                    <div className="mb-5 p-3.5 rounded-xl bg-gradient-to-r from-[#FFF5F8] to-pink-50/50 border border-pink-100/80">
                      <p className="text-[10.5px] font-bold text-gray-700 flex items-center gap-1.5 flex-wrap">
                        <span className="bg-gray-200 px-1.5 py-0.5 rounded font-mono text-gray-600">MRP</span>
                        <span className="text-gray-400">→</span>
                        <span className="bg-[#C2477A]/10 text-[#C2477A] px-1.5 py-0.5 rounded font-bold">Role Discount %</span>
                        <span className="text-gray-400">→</span>
                        <span className="bg-[#FDF2F8] text-[#C2477A] px-1.5 py-0.5 rounded font-bold">Role Base Price</span>
                        <span className="text-gray-400">→</span>
                        <span className="bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded font-bold">Qty Tier Discount %</span>
                        <span className="text-gray-400">→</span>
                        <span className="bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded font-bold">Final Unit Price</span>
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      {[
                        { role: 'salon', label: 'Salon Owner', color: 'rose', emoji: '🏪' },
                        { role: 'artist', label: 'Makeup Artist', color: 'violet', emoji: '🎨' },
                        { role: 'beautician', label: 'Beautician', color: 'emerald', emoji: '💅' },
                      ].map(({ role, label, color, emoji }) => {
                        const discPct = Number(roleDiscounts[role]) || 0;
                        const basePrice = Math.round((Number(previewMrp) || 500) * (1 - discPct / 100));
                        return (
                          <div key={role} className={`p-4 rounded-xl border bg-${color}-50/50 border-${color}-100/80`}>
                            <div className="flex items-center gap-2 mb-3">
                              <span className="text-lg">{emoji}</span>
                              <div>
                                <p className="font-extrabold text-xs text-gray-900">{label}</p>
                                <p className={`text-[10px] font-semibold text-${color}-600`}>Professional Role</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 mb-2">
                              <div className="relative flex-1">
                                <input
                                  type="number"
                                  min="0"
                                  max="99"
                                  step="1"
                                  value={discPct}
                                  onChange={(e) => handleRoleDiscountChange(role, e.target.value)}
                                  className="w-full p-2.5 pr-7 rounded-xl border border-pink-100/80 outline-none focus:border-[#C2477A] focus:ring-2 focus:ring-[#C2477A]/20 bg-white font-extrabold text-[#C2477A] text-sm text-center shadow-xs"
                                />
                                <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-xs">%</span>
                              </div>
                            </div>
                            <p className="text-[10px] text-gray-400 font-medium text-center">
                              e.g. ₹{Number(previewMrp) || 500} MRP → <span className="font-bold text-gray-700">₹{basePrice}</span>
                            </p>
                          </div>
                        );
                      })}
                    </div>

                    <div className="mt-4 p-3 rounded-xl bg-gray-50 border border-gray-100">
                      <div className="grid grid-cols-3 gap-3 text-center text-[11px]">
                        <div>
                          <span className="font-semibold text-gray-500 block">General User</span>
                          <span className="font-black text-gray-900 text-sm">No Discount</span>
                          <span className="text-[10px] text-gray-400 block">Pays full MRP always</span>
                        </div>
                        <div>
                          <span className="font-semibold text-gray-500 block">Min Tier (1–2 units)</span>
                          <span className="font-black text-gray-900 text-sm">{quantityTiers[0]?.additionalDiscount || 0}% extra off</span>
                          <span className="text-[10px] text-gray-400 block">on role base price</span>
                        </div>
                        <div>
                          <span className="font-semibold text-gray-500 block">Max Tier (10+ units)</span>
                          <span className="font-black text-gray-900 text-sm">{quantityTiers[quantityTiers.length - 1]?.additionalDiscount || 0}% extra off</span>
                          <span className="text-[10px] text-gray-400 block">on role base price</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* QUANTITY TIER CONFIGURATION CARD */}
                  <div className="bg-white p-6 rounded-2xl border border-pink-100/80 shadow-sm">
                    <div className="flex items-center justify-between mb-5 pb-4 border-b border-pink-100/60">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-xl bg-[#FFF5F8] text-[#C2477A] flex items-center justify-center shadow-xs">
                          <Layers size={18} />
                        </div>
                        <div>
                          <h3 className="font-extrabold text-sm text-gray-900 tracking-wide uppercase">Quantity Tier Discount Configuration</h3>
                          <p className="text-[11px] text-gray-400 font-medium mt-0.5">Additional % off role base price — pro roles only, 10+ continues at last tier</p>
                        </div>
                      </div>
                      <button
                        onClick={handleAddTier}
                        className="flex items-center gap-1.5 text-[11px] font-bold bg-[#FFF5F8] text-[#C2477A] border border-[#FCE4EC] px-3 py-1.5 rounded-xl hover:bg-[#FDF2F8] transition-all cursor-pointer"
                      >
                        <Plus size={13} /> Add Tier
                      </button>
                    </div>

                    <div className="space-y-3">
                      {/* Table Header */}
                      <div className="grid grid-cols-12 gap-3 px-3 text-[10px] font-black text-gray-500 uppercase tracking-wider">
                        <div className="col-span-1">#</div>
                        <div className="col-span-3">Tier Label</div>
                        <div className="col-span-2 text-center">Min Qty</div>
                        <div className="col-span-2 text-center">Max Qty</div>
                        <div className="col-span-3 text-center">Extra Discount %</div>
                        <div className="col-span-1 text-right">Del</div>
                      </div>

                      {quantityTiers.map((tier, idx) => (
                        <div
                          key={idx}
                          className={`grid grid-cols-12 gap-3 items-center p-3 rounded-xl border ${idx % 2 === 0 ? 'bg-gray-50/70 border-gray-100' : 'bg-white border-pink-50'} hover:border-pink-100 transition-all`}
                        >
                          <div className="col-span-1 text-xs font-black text-gray-400">#{idx + 1}</div>
                          <div className="col-span-3">
                            <input
                              type="text"
                              value={tier.label}
                              onChange={(e) => handleTierChange(idx, 'label', e.target.value)}
                              className="w-full p-2 rounded-lg border border-pink-100/80 outline-none focus:border-[#C2477A] bg-white text-xs font-bold text-gray-800 shadow-xs"
                              placeholder="Label"
                            />
                          </div>
                          <div className="col-span-2 text-center">
                            <input
                              type="number"
                              min="1"
                              value={tier.minQty}
                              onChange={(e) => handleTierChange(idx, 'minQty', e.target.value)}
                              className="w-full p-2 rounded-lg border border-pink-100/80 outline-none focus:border-[#C2477A] bg-white text-xs font-bold text-gray-800 text-center shadow-xs"
                            />
                          </div>
                          <div className="col-span-2 text-center">
                            <input
                              type="number"
                              min="1"
                              value={tier.maxQty === null || tier.maxQty === undefined ? '' : tier.maxQty}
                              onChange={(e) => handleTierChange(idx, 'maxQty', e.target.value === '' ? null : e.target.value)}
                              className="w-full p-2 rounded-lg border border-pink-100/80 outline-none focus:border-[#C2477A] bg-white text-xs font-bold text-gray-800 text-center shadow-xs"
                              placeholder="∞"
                            />
                          </div>
                          <div className="col-span-3">
                            <div className="relative">
                              <input
                                type="number"
                                min="0"
                                max="99"
                                step="0.5"
                                value={tier.additionalDiscount}
                                onChange={(e) => handleTierChange(idx, 'additionalDiscount', e.target.value)}
                                className="w-full p-2 pr-6 rounded-lg border border-[#FCE4EC]/80 outline-none focus:border-[#C2477A] bg-[#FFF5F8]/50 text-xs font-extrabold text-[#C2477A] text-center shadow-xs"
                              />
                              <span className="absolute right-2 top-1/2 -translate-y-1/2 text-violet-400 font-bold text-xs">%</span>
                            </div>
                          </div>
                          <div className="col-span-1 flex justify-end">
                            <button
                              onClick={() => handleRemoveTier(idx)}
                              disabled={quantityTiers.length <= 1}
                              className="w-7 h-7 rounded-lg bg-rose-50 text-rose-400 hover:bg-rose-100 hover:text-rose-600 transition-all flex items-center justify-center cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="mt-4 p-3 rounded-xl bg-amber-50/70 border border-amber-100/80">
                      <p className="text-[10.5px] text-amber-700 font-semibold flex items-start gap-1.5">
                        <AlertTriangle size={12} className="mt-0.5 flex-shrink-0" />
                        Quantities above the highest Max Qty automatically use the last tier's discount. Set Max Qty to blank (∞) for an open-ended final tier.
                      </p>
                    </div>
                  </div>

                </div>

                {/* Right Panel: Live Price Calculator */}
                <div className="space-y-6">
                  {/* LIVE PREVIEW CALCULATOR */}
                  <div className="bg-white p-5 rounded-2xl border border-pink-100/80 shadow-sm sticky top-6">
                    <div className="flex items-center gap-2.5 mb-5 pb-4 border-b border-pink-100/60">
                      <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                        <Calculator size={16} />
                      </div>
                      <div>
                        <h3 className="font-extrabold text-sm text-gray-900">Live Price Calculator</h3>
                        <p className="text-[10px] text-gray-400 font-medium">Preview pricing for any MRP + Qty</p>
                      </div>
                    </div>

                    <div className="space-y-3 mb-5">
                      <div>
                        <label className="block text-[11px] font-bold text-gray-600 mb-1">Product MRP (₹)</label>
                        <input
                          type="number"
                          min="1"
                          value={previewMrp}
                          onChange={(e) => setPreviewMrp(e.target.value)}
                          className="w-full p-2.5 rounded-xl border border-pink-100/80 outline-none focus:border-[#C2477A] focus:ring-2 focus:ring-[#C2477A]/20 bg-white font-extrabold text-gray-900 text-sm shadow-xs"
                          placeholder="e.g. 500"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-gray-600 mb-1">Quantity (units)</label>
                        <input
                          type="number"
                          min="1"
                          value={previewQty}
                          onChange={(e) => setPreviewQty(e.target.value)}
                          className="w-full p-2.5 rounded-xl border border-pink-100/80 outline-none focus:border-[#C2477A] focus:ring-2 focus:ring-[#C2477A]/20 bg-white font-extrabold text-gray-900 text-sm shadow-xs"
                          placeholder="e.g. 3"
                        />
                      </div>
                    </div>

                    {/* Active qty tier indicator */}
                    <div className="mb-4 p-2.5 rounded-xl bg-[#FFF5F8] border border-[#FCE4EC]">
                      <p className="text-[10.5px] font-bold text-[#C2477A] flex items-center gap-1.5">
                        <Layers size={11} />
                        Active Qty Tier: <span className="text-black">
                          {quantityTiers.find(t => {
                            const min = Number(t.minQty);
                            const max = t.maxQty !== null && t.maxQty !== undefined ? Number(t.maxQty) : Infinity;
                            return Number(previewQty) >= min && Number(previewQty) <= max;
                          })?.label || quantityTiers[quantityTiers.length - 1]?.label || '—'}
                        </span>
                        <span className="ml-auto font-extrabold text-[#C2477A]">+{preview.qtyDiscount}% off</span>
                      </p>
                    </div>

                    {/* Price breakdown cards */}
                    <div className="space-y-2">
                      {/* General User */}
                      <div className="p-3 rounded-xl bg-gray-50 border border-gray-100">
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="text-[10px] font-black text-gray-500 uppercase">General User</span>
                            <p className="text-[10px] text-gray-400">No discount — full MRP</p>
                          </div>
                          <div className="text-right">
                            <span className="font-extrabold text-gray-900 text-base">₹{preview.generalPrice}</span>
                            <p className="text-[9px] text-gray-400">per unit</p>
                          </div>
                        </div>
                      </div>

                      {[
                        { label: 'Salon Owner', emoji: '🏪', base: preview.salonBase, final: preview.salonFinal, discPct: Number(roleDiscounts.salon) || 0 },
                        { label: 'Makeup Artist', emoji: '🎨', base: preview.artistBase, final: preview.artistFinal, discPct: Number(roleDiscounts.artist) || 0 },
                        { label: 'Beautician', emoji: '💅', base: preview.beauticianBase, final: preview.beauticianFinal, discPct: Number(roleDiscounts.beautician) || 0 },
                      ].map(({ label, emoji, base, final, discPct }) => (
                        <div key={label} className="p-3 rounded-xl bg-[#FFF5F8]/60 border border-pink-100/70">
                          <div className="flex items-center gap-1.5 mb-2">
                            <span className="text-sm">{emoji}</span>
                            <span className="text-[10px] font-black text-gray-700 uppercase">{label}</span>
                            <span className="ml-auto text-[9px] font-bold text-rose-500 bg-rose-50 border border-rose-100 px-1.5 py-0.5 rounded-md">{discPct}% role off</span>
                          </div>
                          <div className="flex items-end justify-between">
                            <div>
                              <p className="text-[9.5px] text-gray-400">Role base: <span className="font-bold text-gray-600">₹{base}</span></p>
                              {preview.qtyDiscount > 0 && (
                                <p className="text-[9.5px] text-violet-500 font-bold">−{preview.qtyDiscount}% qty tier</p>
                              )}
                            </div>
                            <div className="text-right">
                              <span className="font-extrabold text-[#C2477A] text-base">₹{final}</span>
                              <p className="text-[9px] text-gray-400">per unit × {previewQty} = <span className="font-bold text-gray-700">₹{final * Number(previewQty)}</span></p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* SAVE / RESET ACTIONS */}
                  <div className="bg-white p-5 rounded-2xl border border-pink-100/80 shadow-sm space-y-3">
                    <h3 className="font-extrabold text-sm text-gray-900 uppercase tracking-wide flex items-center gap-2">
                      <Save size={15} className="text-[#C2477A]" /> Save Configuration
                    </h3>
                    <p className="text-[10.5px] text-gray-400 font-medium">
                      All changes sync to Supabase instantly and apply to all live pricing calculations in the User App.
                    </p>
                    <button
                      onClick={handleSavePricingRules}
                      disabled={isSavingPricingRules}
                      className="w-full bg-[#C2477A] hover:bg-[#b83760] text-white font-extrabold text-xs py-3 rounded-xl shadow-sm flex items-center justify-center gap-2 transition-all active:scale-[0.98] cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      {isSavingPricingRules ? (
                        <><Loader2 size={15} className="animate-spin" /> Saving to Supabase…</>
                      ) : (
                        <><Save size={15} /> Save Pricing Rules</>
                      )}
                    </button>
                    <button
                      onClick={handleResetToDefaults}
                      className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs py-2.5 rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer"
                    >
                      <RotateCcw size={13} /> Reset to Defaults
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })()}

        {/* B2B PROFESSIONAL VERIFICATION MODULE */}
        {(activeTab.startsWith('b2b-verification') || activeTab.startsWith('b2b_verification')) && (() => {
          let preset = 'all';
          if (activeTab.includes('/salon')) preset = 'salon';
          else if (activeTab.includes('/makeup-artist') || activeTab.includes('/makeup_artist')) preset = 'artist';
          else if (activeTab.includes('/beautician')) preset = 'beautician';

          return (
            <B2BVerificationPage
              rolePreset={preset}
              initialSubTab="all"
            />
          );
        })()}

        {/* QUICK ACCESS PANEL / COMMAND CENTER */}
        {activeTab === 'quick_panel' && (
          <div className="space-y-6 animate-fade-in pb-12">
            {/* Executive Header Banner */}
            <div className="relative overflow-hidden rounded-3xl bg-linear-to-r from-gray-950 via-[#831843] to-[#C2477A] p-7 text-white shadow-xl border border-pink-900/30">
              <div className="relative z-10 max-w-2xl">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-[11px] font-bold tracking-wide uppercase mb-3">
                  <Sparkles size={13} className="text-pink-300" />
                  <span>Salbeau Executive Command Center</span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white mb-2">
                  Quick Access Hub
                </h1>
                <p className="text-xs sm:text-sm text-pink-100 font-medium leading-relaxed">
                  Real-time store metrics, pending verification alerts, and direct operational shortcuts organized by department.
                </p>
              </div>
              <div className="absolute right-0 bottom-0 opacity-10 pointer-events-none transform translate-x-8 translate-y-8">
                <LayoutGrid size={240} />
              </div>
            </div>

            {/* Live Operational Metrics Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
              <div
                onClick={() => navigateToTab('b2b-verification')}
                className="bg-white p-4 rounded-2xl border border-amber-200/80 shadow-xs hover:shadow-md transition-all cursor-pointer group hover:border-amber-400"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">B2B Pending</span>
                  <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <ShieldCheck size={14} />
                  </div>
                </div>
                <div className="text-2xl font-black text-amber-600">{b2bPendingTotal}</div>
                <div className="text-[10px] text-gray-400 mt-1 font-semibold flex items-center gap-1">
                  <span>Awaiting review</span>
                  <ChevronRight size={10} className="text-amber-500 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </div>

              <div
                onClick={() => navigateToTab('products')}
                className="bg-white p-4 rounded-2xl border border-pink-100/80 shadow-xs hover:shadow-md transition-all cursor-pointer group hover:border-[#C2477A]"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Catalog Products</span>
                  <div className="w-7 h-7 rounded-lg bg-pink-100 text-[#C2477A] flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Package size={14} />
                  </div>
                </div>
                <div className="text-2xl font-black text-gray-900">{products?.length || 0}</div>
                <div className="text-[10px] text-gray-400 mt-1 font-semibold flex items-center gap-1">
                  <span>Manage items</span>
                  <ChevronRight size={10} className="text-[#C2477A] group-hover:translate-x-0.5 transition-transform" />
                </div>
              </div>

              <div
                onClick={() => navigateToTab('order_updated')}
                className="bg-white p-4 rounded-2xl border border-pink-100/80 shadow-xs hover:shadow-md transition-all cursor-pointer group hover:border-blue-400"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Store Orders</span>
                  <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <ShoppingBag size={14} />
                  </div>
                </div>
                <div className="text-2xl font-black text-gray-900">{orders?.length || 0}</div>
                <div className="text-[10px] text-gray-400 mt-1 font-semibold flex items-center gap-1">
                  <span>View live queue</span>
                  <ChevronRight size={10} className="text-blue-500 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </div>

              <div
                onClick={() => navigateToTab('users/b2c')}
                className="bg-white p-4 rounded-2xl border border-pink-100/80 shadow-xs hover:shadow-md transition-all cursor-pointer group hover:border-emerald-400"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">B2C Customers</span>
                  <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <User size={14} />
                  </div>
                </div>
                <div className="text-2xl font-black text-gray-900">{b2cUsersCount}</div>
                <div className="text-[10px] text-gray-400 mt-1 font-semibold flex items-center gap-1">
                  <span>General shoppers</span>
                  <ChevronRight size={10} className="text-emerald-500 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </div>

              <div
                onClick={() => navigateToTab('users/b2b')}
                className="bg-white p-4 rounded-2xl border border-pink-100/80 shadow-xs hover:shadow-md transition-all cursor-pointer group hover:border-purple-400"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">B2B Accounts</span>
                  <div className="w-7 h-7 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Building2 size={14} />
                  </div>
                </div>
                <div className="text-2xl font-black text-gray-900">{b2bUsersCount}</div>
                <div className="text-[10px] text-gray-400 mt-1 font-semibold flex items-center gap-1">
                  <span>Salon/Artist/Beautician</span>
                  <ChevronRight size={10} className="text-purple-500 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </div>

              <div
                onClick={() => navigateToTab('abandoned_carts')}
                className="bg-white p-4 rounded-2xl border border-pink-100/80 shadow-xs hover:shadow-md transition-all cursor-pointer group hover:border-rose-400"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Abandoned Carts</span>
                  <div className="w-7 h-7 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <ShoppingCart size={14} />
                  </div>
                </div>
                <div className="text-2xl font-black text-rose-600">
                  {(abandonedCarts || []).filter(c => c.status === 'abandoned').length}
                </div>
                <div className="text-[10px] text-gray-400 mt-1 font-semibold flex items-center gap-1">
                  <span>Recover sales</span>
                  <ChevronRight size={10} className="text-rose-500 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </div>
            </div>

            {/* Department Shortcuts Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {/* Card 1: B2B Verification Command */}
              <div className="bg-white rounded-3xl p-5 border border-pink-100/80 shadow-xs hover:shadow-md transition-all">
                <div className="flex items-center justify-between pb-3.5 mb-3.5 border-b border-gray-100">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
                      <ShieldCheck size={18} />
                    </div>
                    <div>
                      <h3 className="font-extrabold text-sm text-gray-900">B2B Verification Desk</h3>
                      <p className="text-[11px] text-gray-400 font-medium">Verify professional wholesale accounts</p>
                    </div>
                  </div>
                  {b2bPendingTotal > 0 && (
                    <span className="px-2 py-0.5 bg-amber-500 text-white text-[10px] font-black rounded-full shadow-xs">
                      {b2bPendingTotal} pending
                    </span>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <button
                    onClick={() => navigateToTab('b2b-verification')}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-gray-50 hover:bg-pink-50 hover:text-[#C2477A] text-gray-700 font-bold transition-all text-left cursor-pointer"
                  >
                    <span>All Applications</span>
                    <span className="text-[10px] text-gray-400 font-semibold">{b2bPendingTotal}</span>
                  </button>
                  <button
                    onClick={() => navigateToTab('b2b-verification/salon')}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-gray-50 hover:bg-pink-50 hover:text-[#C2477A] text-gray-700 font-bold transition-all text-left cursor-pointer"
                  >
                    <span>Salon Desk</span>
                    <span className="text-[10px] text-gray-400 font-semibold">{b2bPendingSalon}</span>
                  </button>
                  <button
                    onClick={() => navigateToTab('b2b-verification/makeup-artist')}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-gray-50 hover:bg-pink-50 hover:text-[#C2477A] text-gray-700 font-bold transition-all text-left cursor-pointer"
                  >
                    <span>Makeup Artist</span>
                    <span className="text-[10px] text-gray-400 font-semibold">{b2bPendingArtist}</span>
                  </button>
                  <button
                    onClick={() => navigateToTab('b2b-verification/beautician')}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-gray-50 hover:bg-pink-50 hover:text-[#C2477A] text-gray-700 font-bold transition-all text-left cursor-pointer"
                  >
                    <span>Beautician</span>
                    <span className="text-[10px] text-gray-400 font-semibold">{b2bPendingBeautician}</span>
                  </button>
                </div>
              </div>

              {/* Card 2: Catalog & Store Management */}
              <div className="bg-white rounded-3xl p-5 border border-pink-100/80 shadow-xs hover:shadow-md transition-all">
                <div className="flex items-center justify-between pb-3.5 mb-3.5 border-b border-gray-100">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-pink-50 text-[#C2477A] flex items-center justify-center font-bold">
                      <Package size={18} />
                    </div>
                    <div>
                      <h3 className="font-extrabold text-sm text-gray-900">Catalog & Products</h3>
                      <p className="text-[11px] text-gray-400 font-medium">Manage catalog, shades & bulk imports</p>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <button
                    onClick={() => navigateToTab('products')}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-gray-50 hover:bg-pink-50 hover:text-[#C2477A] text-gray-700 font-bold transition-all text-left cursor-pointer"
                  >
                    <span>Products Matrix</span>
                    <ChevronRight size={13} className="text-gray-400" />
                  </button>
                  <button
                    onClick={() => navigateToTab('products/bulk')}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-indigo-50/70 hover:bg-indigo-100 hover:text-indigo-700 text-indigo-900 font-bold transition-all text-left cursor-pointer"
                  >
                    <span>Bulk Product Entry</span>
                    <span className="px-1.5 py-0.2 bg-indigo-200 text-indigo-800 text-[9px] rounded-md font-black">FAST</span>
                  </button>
                  <button
                    onClick={() => navigateToTab('categories')}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-gray-50 hover:bg-pink-50 hover:text-[#C2477A] text-gray-700 font-bold transition-all text-left cursor-pointer"
                  >
                    <span>Categories</span>
                    <ChevronRight size={13} className="text-gray-400" />
                  </button>
                  <button
                    onClick={() => setIsAddBrandModalOpen(true)}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-gray-50 hover:bg-pink-50 hover:text-[#C2477A] text-gray-700 font-bold transition-all text-left cursor-pointer"
                  >
                    <span>Add Partner Brand</span>
                    <BadgePlus size={13} className="text-[#C2477A]" />
                  </button>
                </div>
              </div>

              {/* Card 3: Customers & Sales Intelligence */}
              <div className="bg-white rounded-3xl p-5 border border-pink-100/80 shadow-xs hover:shadow-md transition-all">
                <div className="flex items-center justify-between pb-3.5 mb-3.5 border-b border-gray-100">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
                      <Users size={18} />
                    </div>
                    <div>
                      <h3 className="font-extrabold text-sm text-gray-900">Customer Base</h3>
                      <p className="text-[11px] text-gray-400 font-medium">B2C Shoppers vs B2B Professionals</p>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <button
                    onClick={() => navigateToTab('users/b2c')}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-gray-50 hover:bg-pink-50 hover:text-[#C2477A] text-gray-700 font-bold transition-all text-left cursor-pointer"
                  >
                    <span>B2C Users</span>
                    <span className="text-[10px] text-gray-400 font-semibold">{b2cUsersCount}</span>
                  </button>
                  <button
                    onClick={() => navigateToTab('users/b2b')}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-gray-50 hover:bg-purple-50 hover:text-purple-700 text-gray-700 font-bold transition-all text-left cursor-pointer"
                  >
                    <span>B2B Users</span>
                    <span className="text-[10px] text-gray-400 font-semibold">{b2bUsersCount}</span>
                  </button>
                  <button
                    onClick={() => navigateToTab('search_requests')}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-gray-50 hover:bg-pink-50 hover:text-[#C2477A] text-gray-700 font-bold transition-all text-left cursor-pointer"
                  >
                    <span>Search Activity</span>
                    <ChevronRight size={13} className="text-gray-400" />
                  </button>
                  <button
                    onClick={() => navigateToTab('abandoned_carts')}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-gray-50 hover:bg-rose-50 hover:text-rose-700 text-gray-700 font-bold transition-all text-left cursor-pointer"
                  >
                    <span>Abandoned Carts</span>
                    <ChevronRight size={13} className="text-gray-400" />
                  </button>
                </div>
              </div>

              {/* Card 4: Orders & Approvals */}
              <div className="bg-white rounded-3xl p-5 border border-pink-100/80 shadow-xs hover:shadow-md transition-all">
                <div className="flex items-center justify-between pb-3.5 mb-3.5 border-b border-gray-100">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                      <ShoppingBag size={18} />
                    </div>
                    <div>
                      <h3 className="font-extrabold text-sm text-gray-900">Orders & Workflow</h3>
                      <p className="text-[11px] text-gray-400 font-medium">Fulfillment & Operations Approvals</p>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <button
                    onClick={() => navigateToTab('order_updated')}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-gray-50 hover:bg-pink-50 hover:text-[#C2477A] text-gray-700 font-bold transition-all text-left cursor-pointer"
                  >
                    <span>Order Updated</span>
                    <ChevronRight size={13} className="text-gray-400" />
                  </button>
                  <button
                    onClick={() => navigateToTab('approval_center')}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-gray-50 hover:bg-amber-50 hover:text-amber-700 text-gray-700 font-bold transition-all text-left cursor-pointer"
                  >
                    <span>Approval Center</span>
                    {(employeeOperations || []).filter(op => op.status === 'pending').length > 0 && (
                      <span className="px-1.5 py-0.2 bg-amber-500 text-white text-[9px] rounded-full font-black">
                        {(employeeOperations || []).filter(op => op.status === 'pending').length}
                      </span>
                    )}
                  </button>
                </div>
              </div>

              {/* Card 5: Pricing Strategy */}
              <div className="bg-white rounded-3xl p-5 border border-pink-100/80 shadow-xs hover:shadow-md transition-all">
                <div className="flex items-center justify-between pb-3.5 mb-3.5 border-b border-gray-100">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                      <Percent size={18} />
                    </div>
                    <div>
                      <h3 className="font-extrabold text-sm text-gray-900">Pricing & Margins</h3>
                      <p className="text-[11px] text-gray-400 font-medium">B2B Wholesale & Cancellation Rules</p>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <button
                    onClick={() => navigateToTab('pricing_rules')}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-gray-50 hover:bg-pink-50 hover:text-[#C2477A] text-gray-700 font-bold transition-all text-left cursor-pointer"
                  >
                    <span>Pricing Rules</span>
                    <ChevronRight size={13} className="text-gray-400" />
                  </button>
                  <button
                    onClick={() => navigateToTab('cancel_fee')}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-gray-50 hover:bg-pink-50 hover:text-[#C2477A] text-gray-700 font-bold transition-all text-left cursor-pointer"
                  >
                    <span>Cancel Fee Matrix</span>
                    <ChevronRight size={13} className="text-gray-400" />
                  </button>
                </div>
              </div>

              {/* Card 6: Team, Audit & System */}
              <div className="bg-white rounded-3xl p-5 border border-pink-100/80 shadow-xs hover:shadow-md transition-all">
                <div className="flex items-center justify-between pb-3.5 mb-3.5 border-b border-gray-100">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-gray-100 text-gray-700 flex items-center justify-center font-bold">
                      <FileText size={18} />
                    </div>
                    <div>
                      <h3 className="font-extrabold text-sm text-gray-900">Team & Security</h3>
                      <p className="text-[11px] text-gray-400 font-medium">Internal staff & Immutable Audit Trail</p>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <button
                    onClick={() => navigateToTab('employees')}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-gray-50 hover:bg-pink-50 hover:text-[#C2477A] text-gray-700 font-bold transition-all text-left cursor-pointer"
                  >
                    <span>Employees List</span>
                    <ChevronRight size={13} className="text-gray-400" />
                  </button>
                  <button
                    onClick={() => navigateToTab('audit_trail')}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-gray-50 hover:bg-pink-50 hover:text-[#C2477A] text-gray-700 font-bold transition-all text-left cursor-pointer"
                  >
                    <span>Audit Trail</span>
                    <ChevronRight size={13} className="text-gray-400" />
                  </button>
                  <button
                    onClick={() => navigateToTab('dashboard_visibility')}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-gray-50 hover:bg-pink-50 hover:text-[#C2477A] text-gray-700 font-bold transition-all text-left cursor-pointer col-span-2"
                  >
                    <span>Dashboard Visibility Settings</span>
                    <Eye size={13} className="text-[#C2477A]" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 9. ABANDONED CARTS PAGE */}
        {activeTab === 'abandoned_carts' && (
          <AbandonedCartsManager
            abandonedCarts={abandonedCarts}
            onNavigateToOrders={() => navigateToTab('order_updated')}
          />
        )}

        {/* 10. FULL-PAGE EMPLOYEE MANAGEMENT ROUTES */}
        {activeTab === 'employees' && (
          <AllEmployeesPage onNavigate={navigateToTab} />
        )}

        {activeTab === 'employees/new' && (
          <AddEmployeePage onNavigate={navigateToTab} />
        )}

        {activeTab === 'employees/activity' && (
          <EmployeeActivityPage onNavigate={navigateToTab} />
        )}

        {activeTab.startsWith('employees/') && activeTab.endsWith('/permissions') && (
          <EmployeePermissionsPage
            employeeId={activeTab.split('/')[1]}
            onNavigate={navigateToTab}
          />
        )}

        {activeTab.startsWith('employees/') && activeTab.endsWith('/edit') && (
          <EditEmployeePage
            employeeId={activeTab.split('/')[1]}
            onNavigate={navigateToTab}
          />
        )}

        {activeTab.startsWith('employees/') && !activeTab.includes('/permissions') && !activeTab.includes('/edit') && activeTab !== 'employees/new' && activeTab !== 'employees/activity' && (
          <EmployeeProfilePage
            employeeId={activeTab.split('/')[1]}
            onNavigate={navigateToTab}
          />
        )}


        {isAddBrandModalOpen && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fade-in">
            <div className="bg-white rounded-3xl border border-pink-100/90 shadow-2xl w-full max-w-md p-6 relative overflow-hidden animate-fade-in">
              {/* Modal Header */}
              <div className="flex items-center justify-between pb-4 mb-5 border-b border-pink-100/70">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-[#FFF5F8] text-[#C2477A] flex items-center justify-center font-bold shadow-2xs">
                    <BadgePlus size={20} />
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
                  className="w-8 h-8 rounded-full bg-gray-100 hover:bg-pink-100 text-gray-500 hover:text-[#C2477A] flex items-center justify-center transition-colors cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Modal Form */}
              <form onSubmit={handleAddBrandSubmit} className="space-y-4 text-xs">
                <div>
                  <label className="block text-gray-800 font-bold mb-1.5 flex items-center gap-1.5">
                    <Tag size={14} className="text-[#C2477A]" />
                    <span>Brand Name</span>
                    <span className="text-[#C2477A]">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Nykaa Cosmetics"
                    value={newBrand.name}
                    onChange={(e) => setNewBrand({ ...newBrand, name: e.target.value })}
                    className="w-full p-3 rounded-xl border border-pink-100/80 outline-none focus:border-[#C2477A] focus:ring-2 focus:ring-[#C2477A]/20 bg-white font-medium shadow-2xs text-gray-900 transition-all placeholder:text-gray-400 text-xs"
                  />
                </div>

                <div>
                  <ImageField
                    label="Brand Logo"
                    sublabel="Drag & drop, paste (Ctrl+V), browse Google, or enter URL"
                    value={newBrand.logo}
                    onChange={(newUrl) => setNewBrand(prev => ({ ...prev, logo: newUrl }))}
                    folder="brands"
                    filenamePrefix="brand"
                    entityName={newBrand.name || 'Brand'}
                    aspectRatio="circle"
                  />
                </div>

                <div>
                  <label className="block text-gray-800 font-bold mb-1.5 flex items-center gap-1.5">
                    <Sparkles size={14} className="text-[#C2477A]" />
                    <span>Category</span>
                  </label>
                  <SearchableSelect
                    options={['Makeup', 'Hair Care', 'Skin Care', 'Lips & Eyes', 'Premium', 'Nails']}
                    value={newBrand.category}
                    onChange={(val) => setNewBrand({ ...newBrand, category: val })}
                    placeholder="Select category..."
                    searchPlaceholder="Search category..."
                  />
                </div>

                {/* Brand Visibility Control */}
                <div className="pt-2 p-3.5 rounded-2xl bg-[#FFF8FA] border border-pink-100 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <label className="text-gray-900 font-extrabold text-xs flex items-center gap-1.5">
                      <Eye size={15} className="text-[#C2477A]" />
                      <span>Brand Visibility in User App</span>
                    </label>
                    <span
                      className={`text-[10px] font-black px-2.5 py-0.5 rounded-full border transition-all ${
                        newBrand.enabled
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-gray-100 text-gray-500 border-gray-200'
                      }`}
                    >
                      {newBrand.enabled ? '● Active in App' : '○ Inactive / Hidden'}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    {/* Active Option */}
                    <button
                      type="button"
                      onClick={() => setNewBrand(prev => ({ ...prev, enabled: true }))}
                      className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                        newBrand.enabled
                          ? 'bg-emerald-50/90 border-emerald-300 ring-2 ring-emerald-400/30 shadow-2xs'
                          : 'bg-white border-gray-200 hover:border-emerald-200 hover:bg-emerald-50/30'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className={`text-xs font-black flex items-center gap-1.5 ${newBrand.enabled ? 'text-emerald-800' : 'text-gray-600'}`}>
                          <CheckCircle size={13} className={newBrand.enabled ? 'text-emerald-600' : 'text-gray-400'} />
                          Active
                        </span>
                        <div className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${newBrand.enabled ? 'border-emerald-600 bg-emerald-600' : 'border-gray-300'}`}>
                          {newBrand.enabled && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                        </div>
                      </div>
                      <p className="text-[10px] text-gray-500 font-medium mt-1 leading-snug">
                        Visible to customers in the User App brand catalog and product lists.
                      </p>
                    </button>

                    {/* Inactive Option */}
                    <button
                      type="button"
                      onClick={() => setNewBrand(prev => ({ ...prev, enabled: false }))}
                      className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                        !newBrand.enabled
                          ? 'bg-rose-50/90 border-rose-300 ring-2 ring-rose-400/30 shadow-2xs'
                          : 'bg-white border-gray-200 hover:border-rose-200 hover:bg-rose-50/30'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className={`text-xs font-black flex items-center gap-1.5 ${!newBrand.enabled ? 'text-rose-800' : 'text-gray-600'}`}>
                          <EyeOff size={13} className={!newBrand.enabled ? 'text-rose-600' : 'text-gray-400'} />
                          Inactive
                        </span>
                        <div className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${!newBrand.enabled ? 'border-rose-600 bg-rose-600' : 'border-gray-300'}`}>
                          {!newBrand.enabled && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                        </div>
                      </div>
                      <p className="text-[10px] text-gray-500 font-medium mt-1 leading-snug">
                        Hidden immediately from customer view across the entire User App.
                      </p>
                    </button>
                  </div>
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
                    className="w-2/3 bg-gradient-to-r from-[#C2477A] to-[#E25586] hover:from-[#b83760] hover:to-[#C2477A] text-white py-3 rounded-xl font-bold shadow-sm hover:shadow-md transition-all active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer text-xs"
                  >
                    <BadgePlus size={16} /> Save Brand
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Edit Brand Popup Modal */}
        {isEditBrandModalOpen && editingBrand && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fade-in">
            <div className="bg-white rounded-3xl border border-pink-100/90 shadow-2xl w-full max-w-md p-6 relative overflow-hidden animate-fade-in">
              {/* Modal Header */}
              <div className="flex items-center justify-between pb-4 mb-5 border-b border-pink-100/70">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-[#FFF5F8] text-[#C2477A] flex items-center justify-center font-bold shadow-2xs">
                    <Edit size={18} />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-base text-gray-900 tracking-wide uppercase">
                      Edit Partner Brand
                    </h3>
                    <span className="text-[11px] text-gray-400 font-medium block">
                      ID: {editingBrand.id}
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setIsEditBrandModalOpen(false);
                    setEditingBrand(null);
                  }}
                  className="w-8 h-8 rounded-full bg-gray-100 hover:bg-pink-100 text-gray-500 hover:text-[#C2477A] flex items-center justify-center transition-colors cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Modal Form */}
              <form onSubmit={handleEditBrandSubmit} className="space-y-4 text-xs">
                <div>
                  <label className="block text-gray-800 font-bold mb-1.5 flex items-center gap-1.5">
                    <Tag size={14} className="text-[#C2477A]" />
                    <span>Brand Name</span>
                    <span className="text-[#C2477A]">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Nykaa Cosmetics"
                    value={editingBrand.name}
                    onChange={(e) => setEditingBrand({ ...editingBrand, name: e.target.value })}
                    className="w-full p-3 rounded-xl border border-pink-100/80 outline-none focus:border-[#C2477A] focus:ring-2 focus:ring-[#C2477A]/20 bg-white font-medium shadow-2xs text-gray-900 transition-all placeholder:text-gray-400 text-xs"
                  />
                </div>

                <div>
                  <ImageField
                    label="Brand Logo Image"
                    sublabel="Drag & drop, paste (Ctrl+V), browse Google, or enter URL"
                    value={editingBrand.logo}
                    onChange={(newUrl) => setEditingBrand(prev => ({ ...prev, logo: newUrl }))}
                    folder="brands"
                    filenamePrefix="brand"
                    entityName={editingBrand.name || 'Brand'}
                    aspectRatio="circle"
                  />
                </div>

                <div>
                  <label className="block text-gray-800 font-bold mb-1.5 flex items-center gap-1.5">
                    <Sparkles size={14} className="text-[#C2477A]" />
                    <span>Category</span>
                  </label>
                  <select
                    value={editingBrand.category}
                    onChange={(e) => setEditingBrand({ ...editingBrand, category: e.target.value })}
                    className="w-full p-3 rounded-xl border border-pink-100/80 outline-none focus:border-[#C2477A] focus:ring-2 focus:ring-[#C2477A]/20 bg-white font-medium cursor-pointer shadow-2xs text-gray-900 transition-all text-xs"
                  >
                    <option value="Makeup">Makeup</option>
                    <option value="Hair Care">Hair Care</option>
                    <option value="Skin Care">Skin Care</option>
                    <option value="Lips & Eyes">Lips & Eyes</option>
                    <option value="Premium">Premium</option>
                    <option value="Nails">Nails</option>
                  </select>
                </div>

                {/* Brand Visibility Control */}
                <div className="pt-2 p-3.5 rounded-2xl bg-[#FFF8FA] border border-pink-100 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <label className="text-gray-900 font-extrabold text-xs flex items-center gap-1.5">
                      <Eye size={15} className="text-[#C2477A]" />
                      <span>Brand Visibility in User App</span>
                    </label>
                    <span
                      className={`text-[10px] font-black px-2.5 py-0.5 rounded-full border transition-all ${
                        editingBrand.enabled
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-gray-100 text-gray-500 border-gray-200'
                      }`}
                    >
                      {editingBrand.enabled ? '● Active in App' : '○ Inactive / Hidden'}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    {/* Active Option */}
                    <button
                      type="button"
                      onClick={() => setEditingBrand(prev => ({ ...prev, enabled: true }))}
                      className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                        editingBrand.enabled
                          ? 'bg-emerald-50/90 border-emerald-300 ring-2 ring-emerald-400/30 shadow-2xs'
                          : 'bg-white border-gray-200 hover:border-emerald-200 hover:bg-emerald-50/30'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className={`text-xs font-black flex items-center gap-1.5 ${editingBrand.enabled ? 'text-emerald-800' : 'text-gray-600'}`}>
                          <CheckCircle size={13} className={editingBrand.enabled ? 'text-emerald-600' : 'text-gray-400'} />
                          Active
                        </span>
                        <div className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${editingBrand.enabled ? 'border-emerald-600 bg-emerald-600' : 'border-gray-300'}`}>
                          {editingBrand.enabled && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                        </div>
                      </div>
                      <p className="text-[10px] text-gray-500 font-medium mt-1 leading-snug">
                        Visible to customers in the User App brand catalog and product lists.
                      </p>
                    </button>

                    {/* Inactive Option */}
                    <button
                      type="button"
                      onClick={() => setEditingBrand(prev => ({ ...prev, enabled: false }))}
                      className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                        !editingBrand.enabled
                          ? 'bg-rose-50/90 border-rose-300 ring-2 ring-rose-400/30 shadow-2xs'
                          : 'bg-white border-gray-200 hover:border-rose-200 hover:bg-rose-50/30'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className={`text-xs font-black flex items-center gap-1.5 ${!editingBrand.enabled ? 'text-rose-800' : 'text-gray-600'}`}>
                          <EyeOff size={13} className={!editingBrand.enabled ? 'text-rose-600' : 'text-gray-400'} />
                          Inactive
                        </span>
                        <div className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${!editingBrand.enabled ? 'border-rose-600 bg-rose-600' : 'border-gray-300'}`}>
                          {!editingBrand.enabled && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                        </div>
                      </div>
                      <p className="text-[10px] text-gray-500 font-medium mt-1 leading-snug">
                        Hidden immediately from customer view across the entire User App.
                      </p>
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditBrandModalOpen(false);
                      setEditingBrand(null);
                    }}
                    className="w-1/3 bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 rounded-xl font-bold transition-all text-xs cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="w-2/3 bg-gradient-to-r from-[#C2477A] to-[#E25586] hover:from-[#b83760] hover:to-[#C2477A] text-white py-3 rounded-xl font-bold shadow-sm hover:shadow-md transition-all active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer text-xs"
                  >
                    <Save size={15} /> Save Changes
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Add Category Popup Modal */}
        {isAddCategoryModalOpen && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fade-in">
            <div className="bg-white rounded-3xl border border-pink-100/90 shadow-2xl w-full max-w-md p-6 relative overflow-hidden animate-fade-in">
              {/* Modal Header */}
              <div className="flex items-center justify-between pb-4 mb-5 border-b border-pink-100/70">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-[#FFF5F8] text-[#C2477A] flex items-center justify-center font-bold shadow-2xs">
                    <FolderPlus size={20} />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-base text-gray-900 tracking-wide uppercase">
                      Add New Category Item
                    </h3>
                    <span className="text-[11px] text-gray-400 font-medium block">
                      Create category item for store catalog & app navigation
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsAddCategoryModalOpen(false)}
                  className="w-8 h-8 rounded-full bg-gray-100 hover:bg-pink-100 text-gray-500 hover:text-[#C2477A] flex items-center justify-center transition-colors cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Modal Form */}
              <form onSubmit={handleAddCategorySubmit} className="space-y-4 text-xs">
                <div>
                  <label className="block text-gray-800 font-bold mb-1.5 flex items-center gap-1.5">
                    <Tag size={14} className="text-[#C2477A]" />
                    <span>Category Name</span>
                    <span className="text-[#C2477A]">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Body Care & Lotion"
                    value={newCategory.name}
                    onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                    className="w-full p-3 rounded-xl border border-pink-100/80 outline-none focus:border-[#C2477A] focus:ring-2 focus:ring-[#C2477A]/20 bg-white font-medium shadow-2xs text-gray-900 transition-all placeholder:text-gray-400 text-xs"
                  />
                </div>

                <div className="flex items-center gap-3 pt-2 p-3 rounded-xl bg-[#FFF5F8]/50 border border-pink-100/60">
                  <input
                    type="checkbox"
                    id="enabledCheckCatModal"
                    checked={newCategory.enabled}
                    onChange={(e) => setNewCategory({ ...newCategory, enabled: e.target.checked })}
                    className="w-4 h-4 text-[#C2477A] accent-[#C2477A] rounded-md cursor-pointer"
                  />
                  <label htmlFor="enabledCheckCatModal" className="text-gray-800 font-semibold text-xs cursor-pointer select-none flex items-center gap-1.5">
                    <Eye size={14} className="text-[#C2477A]" />
                    <span>Active in Mobile App</span>
                  </label>
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsAddCategoryModalOpen(false)}
                    className="w-1/3 bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 rounded-xl font-bold transition-all text-xs cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="w-2/3 bg-gradient-to-r from-[#C2477A] to-[#E25586] hover:from-[#b83760] hover:to-[#C2477A] text-white py-3 rounded-xl font-bold shadow-sm hover:shadow-md transition-all active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer text-xs"
                  >
                    <FolderPlus size={16} /> Save Category Item
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Edit Category Popup Modal */}
        {isEditCategoryModalOpen && editingCategory && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fade-in">
            <div className="bg-white rounded-3xl border border-pink-100/90 shadow-2xl w-full max-w-md p-6 relative overflow-hidden animate-fade-in">
              {/* Modal Header */}
              <div className="flex items-center justify-between pb-4 mb-5 border-b border-pink-100/70">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-[#FFF5F8] text-[#C2477A] flex items-center justify-center font-bold shadow-2xs">
                    <Edit size={18} />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-base text-gray-900 tracking-wide uppercase">
                      Edit Category Item
                    </h3>
                    <span className="text-[11px] text-gray-400 font-medium block">
                      Update category details and display status
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsEditCategoryModalOpen(false)}
                  className="w-8 h-8 rounded-full bg-gray-100 hover:bg-pink-100 text-gray-500 hover:text-[#C2477A] flex items-center justify-center transition-colors cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Modal Form */}
              <form onSubmit={handleSaveEditCategory} className="space-y-4 text-xs">
                <div>
                  <label className="block text-gray-800 font-bold mb-1.5 flex items-center gap-1.5">
                    <Tag size={14} className="text-[#C2477A]" />
                    <span>Category Name</span>
                    <span className="text-[#C2477A]">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Hair Care"
                    value={editingCategory.name}
                    onChange={(e) => setEditingCategory({ ...editingCategory, name: e.target.value })}
                    className="w-full p-3 rounded-xl border border-pink-100/80 outline-none focus:border-[#C2477A] focus:ring-2 focus:ring-[#C2477A]/20 bg-white font-medium shadow-2xs text-gray-900 transition-all placeholder:text-gray-400 text-xs"
                  />
                </div>

                <div className="flex items-center gap-3 pt-2 p-3 rounded-xl bg-[#FFF5F8]/50 border border-pink-100/60">
                  <input
                    type="checkbox"
                    id="editEnabledCheckCatModal"
                    checked={editingCategory.enabled}
                    onChange={(e) => setEditingCategory({ ...editingCategory, enabled: e.target.checked })}
                    className="w-4 h-4 text-[#C2477A] accent-[#C2477A] rounded-md cursor-pointer"
                  />
                  <label htmlFor="editEnabledCheckCatModal" className="text-gray-800 font-semibold text-xs cursor-pointer select-none flex items-center gap-1.5">
                    <Eye size={14} className="text-[#C2477A]" />
                    <span>Active in Mobile App</span>
                  </label>
                </div>

                <div className="pt-3 flex items-center justify-end gap-2.5">
                  <button
                    type="button"
                    onClick={() => setIsEditCategoryModalOpen(false)}
                    className="px-4 py-2.5 rounded-xl border border-gray-200 text-gray-600 font-bold text-xs hover:bg-gray-50 transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-xl bg-[#C2477A] hover:bg-[#b83760] text-white font-bold text-xs shadow-xs transition-all cursor-pointer active:scale-[0.98]"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Delete Category Confirmation Modal */}
        {isDeleteCategoryModalOpen && categoryToDelete && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fade-in">
            <div className="bg-white rounded-3xl border border-pink-100/90 shadow-2xl w-full max-w-md p-6 relative overflow-hidden animate-fade-in">
              {/* Modal Header */}
              <div className="flex items-center justify-between pb-4 mb-4 border-b border-pink-100/70">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-rose-50 text-rose-600 border border-rose-100 flex items-center justify-center font-bold shadow-2xs shrink-0">
                    <Trash2 size={20} />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-base text-gray-900 tracking-tight">
                      Delete Category
                    </h3>
                    <span className="text-[11px] text-gray-400 font-medium block">
                      Confirmation required before deleting from Supabase
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  disabled={isDeletingCategory}
                  onClick={() => {
                    setIsDeleteCategoryModalOpen(false);
                    setCategoryToDelete(null);
                  }}
                  className="w-8 h-8 rounded-full bg-gray-100 hover:bg-pink-100 text-gray-500 hover:text-[#C2477A] flex items-center justify-center transition-colors cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Modal Body */}
              <div className="space-y-4 text-xs">
                <p className="text-gray-600 leading-relaxed">
                  Are you sure you want to permanently delete category <strong className="text-gray-900 font-bold">"{categoryToDelete.name}"</strong>?
                </p>

                <div className="p-3.5 rounded-2xl bg-rose-50/60 border border-rose-100 space-y-2">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-gray-500 font-medium">Category ID:</span>
                    <span className="font-mono text-gray-700 font-bold">{categoryToDelete.id}</span>
                  </div>
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-gray-500 font-medium">Status:</span>
                    <span className={`font-bold ${categoryToDelete.enabled !== false ? 'text-emerald-600' : 'text-gray-500'}`}>
                      {categoryToDelete.enabled !== false ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-gray-500 font-medium">Linked Products:</span>
                    <span className="font-bold text-[#C2477A]">{categoryToDelete.productsCount || 0} Products</span>
                  </div>
                </div>

                <p className="text-[11px] text-rose-500 font-medium">
                  ⚠️ This record will be permanently deleted from the database.
                </p>

                {/* Modal Actions */}
                <div className="flex items-center gap-3 pt-2">
                  <button
                    type="button"
                    disabled={isDeletingCategory}
                    onClick={() => {
                      setIsDeleteCategoryModalOpen(false);
                      setCategoryToDelete(null);
                    }}
                    className="w-1/3 bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 rounded-xl font-bold transition-all text-xs cursor-pointer disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={isDeletingCategory}
                    onClick={async () => {
                      try {
                        setIsDeletingCategory(true);
                        await deleteCategory(categoryToDelete.id);
                        setIsDeleteCategoryModalOpen(false);
                        setCategoryToDelete(null);
                        setCategoryNotice({ type: 'success', message: 'Category deleted successfully from Supabase!' });
                        setTimeout(() => setCategoryNotice(null), 3500);
                      } catch (err) {
                        setCategoryNotice({ type: 'error', message: 'Failed to delete category: ' + (err.message || err) });
                        setTimeout(() => setCategoryNotice(null), 4000);
                      } finally {
                        setIsDeletingCategory(false);
                      }
                    }}
                    className="w-2/3 bg-rose-600 hover:bg-rose-700 text-white py-3 rounded-xl font-bold shadow-xs hover:shadow transition-all active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer text-xs disabled:opacity-50"
                  >
                    <Trash2 size={15} />
                    <span>{isDeletingCategory ? 'Deleting...' : 'Yes, Delete Category'}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Add Home Banner Popup Modal */}
        {isAddBannerModalOpen && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fade-in">
            <div className="bg-white rounded-3xl border border-pink-100/90 shadow-2xl w-full max-w-lg p-6 relative overflow-hidden animate-fade-in max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between pb-4 mb-4 border-b border-pink-100/70">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-[#FFF5F8] text-[#C2477A] flex items-center justify-center font-bold shadow-2xs">
                    <ImageIcon size={20} />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-base text-gray-900 tracking-wide uppercase">
                      Add New Home Banner
                    </h3>
                    <span className="text-[11px] text-gray-400 font-medium block">
                      Create marketing banner for Mobile App Home carousel
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsAddBannerModalOpen(false)}
                  className="w-8 h-8 rounded-full bg-gray-100 hover:bg-pink-100 text-gray-500 hover:text-[#C2477A] flex items-center justify-center transition-colors cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>

              <form onSubmit={handleSaveAddBanner} className="space-y-4 text-xs">
                <div>
                  <label className="block text-gray-800 font-bold mb-1.5">Badge / Theme Label</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. BEAUTY ESSENTIALS"
                    value={bannerFormData.theme}
                    onChange={(e) => setBannerFormData({ ...bannerFormData, theme: e.target.value })}
                    className="w-full p-3 rounded-xl border border-pink-100 outline-none focus:border-[#C2477A] bg-white font-medium text-xs text-gray-900 shadow-2xs"
                  />
                </div>

                <div>
                  <label className="block text-gray-800 font-bold mb-1.5">Headline Title</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Glow Your Own Way"
                    value={bannerFormData.title}
                    onChange={(e) => setBannerFormData({ ...bannerFormData, title: e.target.value })}
                    className="w-full p-3 rounded-xl border border-pink-100 outline-none focus:border-[#C2477A] bg-white font-medium text-xs text-gray-900 shadow-2xs"
                  />
                </div>

                <div>
                  <label className="block text-gray-800 font-bold mb-1.5">Subtitle / Subtext</label>
                  <input
                    type="text"
                    placeholder="e.g. Discover authentic beauty, salon & grooming formulations"
                    value={bannerFormData.subtitle}
                    onChange={(e) => setBannerFormData({ ...bannerFormData, subtitle: e.target.value })}
                    className="w-full p-3 rounded-xl border border-pink-100 outline-none focus:border-[#C2477A] bg-white font-medium text-xs text-gray-900 shadow-2xs"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-gray-800 font-bold mb-1.5">CTA Button Label</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Shop Best Sellers →"
                      value={bannerFormData.ctaText}
                      onChange={(e) => setBannerFormData({ ...bannerFormData, ctaText: e.target.value })}
                      className="w-full p-3 rounded-xl border border-pink-100 outline-none focus:border-[#C2477A] bg-white font-medium text-xs text-gray-900 shadow-2xs"
                    />
                  </div>

                  <div>
                    <label className="block text-gray-800 font-bold mb-1.5">Destination Type</label>
                    <select
                      value={bannerFormData.destinationType}
                      onChange={(e) => setBannerFormData({ ...bannerFormData, destinationType: e.target.value })}
                      className="w-full p-3 rounded-xl border border-pink-100 outline-none focus:border-[#C2477A] bg-white font-bold text-xs text-gray-900 cursor-pointer shadow-2xs"
                    >
                      <option value="BEST_SELLERS">Best Sellers Page</option>
                      <option value="CATEGORY">Category Screen</option>
                      <option value="SUBCATEGORY">Sub Category</option>
                      <option value="BRAND">Brand Screen</option>
                      <option value="PRODUCT">Specific Product</option>
                      <option value="NEW_ARRIVALS">New Arrivals</option>
                    </select>
                  </div>
                </div>

                {bannerFormData.destinationType === 'CATEGORY' && (
                  <div>
                    <label className="block text-gray-800 font-bold mb-1.5">Select Target Category</label>
                    <select
                      value={bannerFormData.destinationId}
                      onChange={(e) => setBannerFormData({ ...bannerFormData, destinationId: e.target.value })}
                      className="w-full p-3 rounded-xl border border-pink-100 outline-none focus:border-[#C2477A] bg-white font-bold text-xs text-gray-900 cursor-pointer shadow-2xs"
                    >
                      {(categories || []).map((cat) => (
                        <option key={cat.id} value={cat.name}>
                          {cat.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {bannerFormData.destinationType !== 'CATEGORY' && bannerFormData.destinationType !== 'BEST_SELLERS' && (
                  <div>
                    <label className="block text-gray-800 font-bold mb-1.5">Destination Target / ID</label>
                    <input
                      type="text"
                      placeholder="e.g. Skin Care or Brand Name"
                      value={bannerFormData.destinationId}
                      onChange={(e) => setBannerFormData({ ...bannerFormData, destinationId: e.target.value })}
                      className="w-full p-3 rounded-xl border border-pink-100 outline-none focus:border-[#C2477A] bg-white font-medium text-xs text-gray-900 shadow-2xs"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-gray-800 font-bold mb-1.5">Banner Image URL</label>
                  <input
                    type="url"
                    required
                    placeholder="https://mlhlpslhrvwjasbttghw.supabase.co/storage/v1/object/public/products/home-banners/banner_1.jpg"
                    value={bannerFormData.imageUrl}
                    onChange={(e) => setBannerFormData({ ...bannerFormData, imageUrl: e.target.value })}
                    className="w-full p-3 rounded-xl border border-pink-100 outline-none focus:border-[#C2477A] bg-white font-medium text-xs text-gray-900 shadow-2xs mb-2"
                  />

                  {/* Quick Select Presets for the 5 official banners */}
                  <div className="bg-[#FFF5F8] p-2.5 rounded-xl border border-[#FCE4EC]">
                    <span className="text-[10px] font-bold text-gray-500 block mb-1.5">
                      Quick Preset Images (Supabase Storage):
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {[1, 2, 3, 4, 5].map((num) => {
                        const url = `https://mlhlpslhrvwjasbttghw.supabase.co/storage/v1/object/public/products/home-banners/banner_${num}.jpg`;
                        return (
                          <button
                            key={num}
                            type="button"
                            onClick={() => setBannerFormData({ ...bannerFormData, imageUrl: url })}
                            className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-all ${
                              bannerFormData.imageUrl === url
                                ? 'bg-[#C2477A] text-white shadow-2xs'
                                : 'bg-white border border-[#FCE4EC] text-[#C2477A] hover:bg-pink-50'
                            }`}
                          >
                            Banner {num}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 pt-2 p-3 rounded-xl bg-[#FFF5F8]/50 border border-pink-100/60">
                  <input
                    type="checkbox"
                    id="bannerActiveCheckAdd"
                    checked={bannerFormData.isActive}
                    onChange={(e) => setBannerFormData({ ...bannerFormData, isActive: e.target.checked })}
                    className="w-4 h-4 text-[#C2477A] accent-[#C2477A] rounded-md cursor-pointer"
                  />
                  <label htmlFor="bannerActiveCheckAdd" className="text-gray-800 font-semibold text-xs cursor-pointer select-none flex items-center gap-1.5">
                    <Eye size={14} className="text-[#C2477A]" />
                    <span>Active in Mobile App Carousel</span>
                  </label>
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsAddBannerModalOpen(false)}
                    className="w-1/3 bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 rounded-xl font-bold transition-all text-xs cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="w-2/3 bg-gradient-to-r from-[#C2477A] to-[#E25586] hover:from-[#b83760] hover:to-[#C2477A] text-white py-3 rounded-xl font-bold shadow-sm hover:shadow-md transition-all active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer text-xs"
                  >
                    <Plus size={16} /> Save Banner
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Edit Home Banner Popup Modal */}
        {isEditBannerModalOpen && editingBanner && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fade-in">
            <div className="bg-white rounded-3xl border border-pink-100/90 shadow-2xl w-full max-w-lg p-6 relative overflow-hidden animate-fade-in max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between pb-4 mb-4 border-b border-pink-100/70">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-[#FFF5F8] text-[#C2477A] flex items-center justify-center font-bold shadow-2xs">
                    <Edit size={20} />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-base text-gray-900 tracking-wide uppercase">
                      Edit Home Banner #{editingBanner.id}
                    </h3>
                    <span className="text-[11px] text-gray-400 font-medium block">
                      Update banner content and click destination
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsEditBannerModalOpen(false)}
                  className="w-8 h-8 rounded-full bg-gray-100 hover:bg-pink-100 text-gray-500 hover:text-[#C2477A] flex items-center justify-center transition-colors cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>

              <form onSubmit={handleSaveEditBanner} className="space-y-4 text-xs">
                <div>
                  <label className="block text-gray-800 font-bold mb-1.5">Badge / Theme Label</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. BEAUTY ESSENTIALS"
                    value={bannerFormData.theme}
                    onChange={(e) => setBannerFormData({ ...bannerFormData, theme: e.target.value })}
                    className="w-full p-3 rounded-xl border border-pink-100 outline-none focus:border-[#C2477A] bg-white font-medium text-xs text-gray-900 shadow-2xs"
                  />
                </div>

                <div>
                  <label className="block text-gray-800 font-bold mb-1.5">Headline Title</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Glow Your Own Way"
                    value={bannerFormData.title}
                    onChange={(e) => setBannerFormData({ ...bannerFormData, title: e.target.value })}
                    className="w-full p-3 rounded-xl border border-pink-100 outline-none focus:border-[#C2477A] bg-white font-medium text-xs text-gray-900 shadow-2xs"
                  />
                </div>

                <div>
                  <label className="block text-gray-800 font-bold mb-1.5">Subtitle / Subtext</label>
                  <input
                    type="text"
                    placeholder="e.g. Discover authentic beauty, salon & grooming formulations"
                    value={bannerFormData.subtitle}
                    onChange={(e) => setBannerFormData({ ...bannerFormData, subtitle: e.target.value })}
                    className="w-full p-3 rounded-xl border border-pink-100 outline-none focus:border-[#C2477A] bg-white font-medium text-xs text-gray-900 shadow-2xs"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-gray-800 font-bold mb-1.5">CTA Button Label</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Shop Best Sellers →"
                      value={bannerFormData.ctaText}
                      onChange={(e) => setBannerFormData({ ...bannerFormData, ctaText: e.target.value })}
                      className="w-full p-3 rounded-xl border border-pink-100 outline-none focus:border-[#C2477A] bg-white font-medium text-xs text-gray-900 shadow-2xs"
                    />
                  </div>

                  <div>
                    <label className="block text-gray-800 font-bold mb-1.5">Destination Type</label>
                    <select
                      value={bannerFormData.destinationType}
                      onChange={(e) => setBannerFormData({ ...bannerFormData, destinationType: e.target.value })}
                      className="w-full p-3 rounded-xl border border-pink-100 outline-none focus:border-[#C2477A] bg-white font-bold text-xs text-gray-900 cursor-pointer shadow-2xs"
                    >
                      <option value="BEST_SELLERS">Best Sellers Page</option>
                      <option value="CATEGORY">Category Screen</option>
                      <option value="SUBCATEGORY">Sub Category</option>
                      <option value="BRAND">Brand Screen</option>
                      <option value="PRODUCT">Specific Product</option>
                      <option value="NEW_ARRIVALS">New Arrivals</option>
                    </select>
                  </div>
                </div>

                {bannerFormData.destinationType === 'CATEGORY' && (
                  <div>
                    <label className="block text-gray-800 font-bold mb-1.5">Select Target Category</label>
                    <select
                      value={bannerFormData.destinationId}
                      onChange={(e) => setBannerFormData({ ...bannerFormData, destinationId: e.target.value })}
                      className="w-full p-3 rounded-xl border border-pink-100 outline-none focus:border-[#C2477A] bg-white font-bold text-xs text-gray-900 cursor-pointer shadow-2xs"
                    >
                      {(categories || []).map((cat) => (
                        <option key={cat.id} value={cat.name}>
                          {cat.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {bannerFormData.destinationType !== 'CATEGORY' && bannerFormData.destinationType !== 'BEST_SELLERS' && (
                  <div>
                    <label className="block text-gray-800 font-bold mb-1.5">Destination Target / ID</label>
                    <input
                      type="text"
                      placeholder="e.g. Skin Care or Brand Name"
                      value={bannerFormData.destinationId}
                      onChange={(e) => setBannerFormData({ ...bannerFormData, destinationId: e.target.value })}
                      className="w-full p-3 rounded-xl border border-pink-100 outline-none focus:border-[#C2477A] bg-white font-medium text-xs text-gray-900 shadow-2xs"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-gray-800 font-bold mb-1.5">Banner Image URL</label>
                  <input
                    type="url"
                    required
                    value={bannerFormData.imageUrl}
                    onChange={(e) => setBannerFormData({ ...bannerFormData, imageUrl: e.target.value })}
                    className="w-full p-3 rounded-xl border border-pink-100 outline-none focus:border-[#C2477A] bg-white font-medium text-xs text-gray-900 shadow-2xs mb-2"
                  />

                  {/* Quick Select Presets for the 5 official banners */}
                  <div className="bg-[#FFF5F8] p-2.5 rounded-xl border border-[#FCE4EC]">
                    <span className="text-[10px] font-bold text-gray-500 block mb-1.5">
                      Quick Preset Images (Supabase Storage):
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {[1, 2, 3, 4, 5].map((num) => {
                        const url = `https://mlhlpslhrvwjasbttghw.supabase.co/storage/v1/object/public/products/home-banners/banner_${num}.jpg`;
                        return (
                          <button
                            key={num}
                            type="button"
                            onClick={() => setBannerFormData({ ...bannerFormData, imageUrl: url })}
                            className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-all ${
                              bannerFormData.imageUrl === url
                                ? 'bg-[#C2477A] text-white shadow-2xs'
                                : 'bg-white border border-[#FCE4EC] text-[#C2477A] hover:bg-pink-50'
                            }`}
                          >
                            Banner {num}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 pt-2 p-3 rounded-xl bg-[#FFF5F8]/50 border border-pink-100/60">
                  <input
                    type="checkbox"
                    id="bannerActiveCheckEdit"
                    checked={bannerFormData.isActive}
                    onChange={(e) => setBannerFormData({ ...bannerFormData, isActive: e.target.checked })}
                    className="w-4 h-4 text-[#C2477A] accent-[#C2477A] rounded-md cursor-pointer"
                  />
                  <label htmlFor="bannerActiveCheckEdit" className="text-gray-800 font-semibold text-xs cursor-pointer select-none flex items-center gap-1.5">
                    <Eye size={14} className="text-[#C2477A]" />
                    <span>Active in Mobile App Carousel</span>
                  </label>
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsEditBannerModalOpen(false)}
                    className="w-1/3 bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 rounded-xl font-bold transition-all text-xs cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="w-2/3 bg-gradient-to-r from-[#C2477A] to-[#E25586] hover:from-[#b83760] hover:to-[#C2477A] text-white py-3 rounded-xl font-bold shadow-sm hover:shadow-md transition-all active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer text-xs"
                  >
                    <Save size={16} /> Save Changes
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Delete Home Banner Confirmation Modal */}
        {isDeleteBannerModalOpen && bannerToDelete && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fade-in">
            <div className="bg-white rounded-3xl border border-pink-100/90 shadow-2xl w-full max-w-md p-6 relative overflow-hidden animate-fade-in text-center">
              <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold mx-auto mb-3 shadow-2xs border border-rose-100">
                <Trash2 size={22} />
              </div>

              <h3 className="font-extrabold text-base text-gray-900 tracking-wide uppercase">
                Delete Banner
              </h3>
              <p className="text-xs text-gray-500 font-medium mt-1 mb-4">
                Are you sure you want to remove <strong className="text-gray-900">"{bannerToDelete.title}"</strong> from the Home Carousel?
              </p>

              {bannerToDelete.imageUrl && (
                <div className="w-full aspect-[2.56/1] rounded-xl overflow-hidden mb-4 border border-pink-100">
                  <img src={bannerToDelete.imageUrl} alt="Banner" className="w-full h-full object-cover" />
                </div>
              )}

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setIsDeleteBannerModalOpen(false);
                    setBannerToDelete(null);
                  }}
                  className="w-1/2 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2.5 rounded-xl font-bold transition-all text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      await deleteHomeBanner(bannerToDelete.id);
                      setIsDeleteBannerModalOpen(false);
                      setBannerToDelete(null);
                      setBannerNotice({ type: 'success', message: 'Banner deleted successfully from Supabase!' });
                      setTimeout(() => setBannerNotice(null), 3000);
                    } catch (err) {
                      setBannerNotice({ type: 'error', message: 'Failed to delete banner: ' + err.message });
                      setTimeout(() => setBannerNotice(null), 4000);
                    }
                  }}
                  className="w-1/2 bg-rose-600 hover:bg-rose-700 text-white py-2.5 rounded-xl font-bold shadow-sm hover:shadow-md transition-all active:scale-[0.99] flex items-center justify-center gap-1.5 cursor-pointer text-xs"
                >
                  <Trash2 size={14} /> Yes, Delete
                </button>
              </div>
            </div>
          </div>
        )}
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
                  onClick={async () => {
                    await logoutUser();
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
                  className="w-8 h-8 rounded-full bg-gray-100 hover:bg-pink-100 text-gray-500 hover:text-[#C2477A] flex items-center justify-center transition-colors cursor-pointer"
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
                    className="w-full p-3 rounded-xl border border-pink-100 outline-none focus:border-[#C2477A] bg-white font-medium text-xs text-gray-900 cursor-pointer shadow-2xs"
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
                      className="w-full p-3 rounded-xl border border-pink-100 outline-none focus:border-[#C2477A] bg-white font-medium text-xs text-gray-900 shadow-2xs"
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

        {/* Order Acceptance Confirmation Modal (Phase 7: Manual product availability check without inventory constraints) */}
        {isAcceptanceModalOpen && acceptanceTargetOrder && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fade-in">
            <div className="bg-white rounded-3xl border border-pink-100 shadow-2xl w-full max-w-lg p-6 relative overflow-hidden animate-fade-in max-h-[90vh] overflow-y-auto">
              {/* Modal Header */}
              <div className="flex items-center justify-between pb-4 mb-4 border-b border-pink-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold shadow-2xs border border-emerald-100">
                    <CheckCircle2 size={22} />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-base text-gray-900 tracking-wide uppercase">
                      Accept Order #{acceptanceTargetOrder.id}
                    </h3>
                    <span className="text-[11px] text-gray-500 font-medium block">
                      Customer: <strong className="text-gray-800">{acceptanceTargetOrder.userName || 'Customer'}</strong> ({acceptanceTargetOrder.userRole || 'General'})
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsAcceptanceModalOpen(false)}
                  className="w-8 h-8 rounded-full bg-gray-100 hover:bg-pink-100 text-gray-500 hover:text-[#C2477A] flex items-center justify-center transition-colors cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Inventory Management Notice Banner */}
              <div className="bg-amber-50/90 border border-amber-200 rounded-2xl p-3.5 mb-4 text-xs text-amber-900 space-y-1">
                <div className="flex items-center gap-2 font-black text-amber-800 uppercase tracking-wider text-[11px]">
                  <AlertTriangle size={15} className="text-amber-600 shrink-0" />
                  <span>Physical Fulfillment Verification</span>
                </div>
                <p className="text-[11.5px] leading-relaxed text-amber-950 font-medium">
                  Inventory tracking is removed from the system. Confirm that all items in this order are available for fulfillment before accepting.
                </p>
              </div>

              {/* Order Items Preview Table */}
              <div className="space-y-2 mb-4">
                <label className="block text-[11px] font-black text-gray-700 uppercase tracking-wider">
                  Order Line Items ({Array.isArray(acceptanceTargetOrder.items) ? acceptanceTargetOrder.items.length : 0})
                </label>
                <div className="rounded-2xl border border-gray-100 bg-gray-50/70 p-2.5 max-h-48 overflow-y-auto space-y-2">
                  {Array.isArray(acceptanceTargetOrder.items) && acceptanceTargetOrder.items.length > 0 ? (
                    acceptanceTargetOrder.items.map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between p-2 rounded-xl bg-white border border-gray-100 shadow-2xs text-xs">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-8 h-8 rounded-lg bg-pink-50 border border-pink-100 overflow-hidden shrink-0 flex items-center justify-center">
                            {item.product?.image || item.product?.imageUrl ? (
                              <img src={item.product?.image || item.product?.imageUrl} alt={item.product?.name} className="w-full h-full object-cover" />
                            ) : (
                              <Package size={14} className="text-pink-300" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <span className="font-bold text-gray-900 truncate block text-[11.5px]">
                              {item.product?.name || item.name || 'Product Item'}
                            </span>
                            {item.shade && (
                              <span className="text-[10px] text-gray-500 font-medium flex items-center gap-1">
                                {item.shade.hexColor && (
                                  <span className="w-2 h-2 rounded-full inline-block border border-gray-300" style={{ backgroundColor: item.shade.hexColor }} />
                                )}
                                Variant: {item.shade.name || item.shade.title || 'Standard'}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <span className="px-2 py-0.5 rounded-full bg-pink-50 border border-pink-200 text-[#C2477A] font-extrabold text-[11px]">
                            Qty: {item.quantity || 1}
                          </span>
                          <span className="block font-bold text-gray-800 text-[11px] mt-0.5">
                            ₹{item.unitPrice ? (item.unitPrice * (item.quantity || 1)).toFixed(2) : (item.price || 0)}
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-400 italic text-center py-2 text-xs">
                      {acceptanceTargetOrder.itemDescription || 'Standard Package'}
                    </p>
                  )}
                </div>
              </div>

              {/* Checkbox verification */}
              <div className="p-3 rounded-2xl bg-emerald-50/50 border border-emerald-200 mb-5">
                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={itemsConfirmedAvailable}
                    onChange={(e) => setItemsConfirmedAvailable(e.target.checked)}
                    className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-gray-300 mt-0.5 cursor-pointer"
                  />
                  <span className="text-xs font-bold text-gray-800 leading-snug">
                    I confirm that all items in this order are physically verified and ready for packaging &amp; fulfillment.
                  </span>
                </label>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setIsAcceptanceModalOpen(false);
                    setRejectionTargetOrderId(acceptanceTargetOrder.id);
                    setIsRejectionModalOpen(true);
                  }}
                  className="w-1/3 bg-rose-50 hover:bg-rose-100 text-rose-700 py-3 rounded-xl font-bold transition-all text-xs border border-rose-200 cursor-pointer text-center"
                >
                  Unavailable? Reject
                </button>
                <button
                  type="button"
                  onClick={() => setIsAcceptanceModalOpen(false)}
                  className="w-1/4 bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 rounded-xl font-bold transition-all text-xs cursor-pointer text-center"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={!itemsConfirmedAvailable}
                  onClick={handleConfirmAcceptance}
                  className={`w-1/2 py-3 rounded-xl font-bold shadow-sm transition-all flex items-center justify-center gap-1.5 text-xs ${
                    itemsConfirmedAvailable
                      ? 'bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer active:scale-[0.99] shadow-md'
                      : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  <CheckCircle2 size={15} /> Confirm &amp; Accept
                </button>
              </div>
            </div>
          </div>
        )}

        {/* View Invoice Modal */}
        {isInvoiceModalOpen && selectedInvoiceOrder && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fade-in">
            <div className="bg-white rounded-3xl border border-pink-100/90 shadow-2xl w-full max-w-lg p-6 relative overflow-hidden animate-fade-in max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between pb-4 mb-4 border-b border-pink-100">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-[#C2477A] text-white flex items-center justify-center font-bold">
                    <Sparkles size={16} />
                  </div>
                  <div>
                    <h2 style={{ fontFamily: "'Great Vibes', cursive" }} className="text-2xl text-[#C2477A] font-normal leading-none">
                      Salbeau Executive Receipt
                    </h2>
                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">
                      Official Tax Invoice • {selectedInvoiceOrder.id}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setIsInvoiceModalOpen(false)}
                  className="w-8 h-8 rounded-full bg-gray-100 hover:bg-pink-100 text-gray-500 hover:text-[#C2477A] flex items-center justify-center transition-colors cursor-pointer"
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
                  <span className="font-bold text-gray-800">{selectedInvoiceOrder.phone || 'N/A'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-500 font-semibold">Boulevard Branch:</span>
                  <span className="font-bold text-gray-800">{selectedInvoiceOrder.branch}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-500 font-semibold">Order Date & Time:</span>
                  <span className="font-bold text-gray-800">{selectedInvoiceOrder.placedAt || 'N/A'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-500 font-semibold">Fulfillment Type:</span>
                  <span className="font-extrabold text-[#C2477A]">
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
                        if (itemStatus === 'pending_fulfillment') itemBadgeColor = 'bg-[#FFF5F8] text-[#C2477A] border-[#FCE4EC]';
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
                                    reason = prompt('Enter internal rejection reason for item (admin-only):', 'Unable to fulfill at this time') || 'Unable to fulfill at this time';
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
                                <option value="pending_fulfillment">⏳ Pending Fulfillment</option>
                                <option value="delivered">Delivered</option>
                                <option value="rejected">Rejected by Store</option>
                                <option value="cancelled">Cancelled by Customer</option>
                              </select>
                            </td>
                            <td className="p-3 text-center font-bold text-gray-700">{item.quantity}</td>
                            <td className="p-3 text-right font-medium text-gray-700">₹{item.unitPrice}</td>
                            <td className="p-3 text-right font-extrabold text-[#C2477A]">₹{item.quantity * item.unitPrice}</td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td className="p-3 font-bold text-gray-900">{selectedInvoiceOrder.itemDescription || 'Cosmetics Package'}</td>
                        <td className="p-3 text-center font-bold text-gray-700">{selectedInvoiceOrder.status}</td>
                        <td className="p-3 text-center font-bold text-gray-700">1</td>
                        <td className="p-3 text-right font-medium text-gray-700">₹{selectedInvoiceOrder.totalAmount}</td>
                        <td className="p-3 text-right font-extrabold text-[#C2477A]">₹{selectedInvoiceOrder.totalAmount}</td>
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
                  <span className="text-[#C2477A]">₹{selectedInvoiceOrder.totalAmount}</span>
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
                  className="w-2/3 bg-gradient-to-r from-[#C2477A] to-[#E25586] text-white py-2.5 rounded-xl font-bold shadow-sm hover:shadow-md transition-all active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer text-xs"
                >
                  <Printer size={15} /> Print Official Invoice
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Full Edit Product Modal */}
        {isEditProductModalOpen && editingProductData && (
          <div
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setIsEditProductModalOpen(false);
                setEditingProductData(null);
              }
            }}
            className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 overflow-hidden animate-fade-in"
          >
            <div className="bg-white rounded-2xl sm:rounded-3xl border border-pink-100/90 shadow-2xl w-full max-w-2xl max-h-[94vh] sm:max-h-[90vh] flex flex-col relative overflow-hidden animate-fade-in">
              <form onSubmit={handleSaveEditProduct} className="flex flex-col h-full min-h-0 overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between px-5 sm:px-6 py-3.5 sm:py-4 border-b border-pink-100/80 bg-white/95 backdrop-blur-xs shrink-0 z-10">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-[#FFF5F8] text-[#C2477A] flex items-center justify-center font-bold shadow-2xs shrink-0">
                      <Edit size={18} />
                    </div>
                    <div>
                      <h3 className="font-extrabold text-sm sm:text-base text-gray-900 tracking-wide uppercase">
                        Edit Product & Barcode
                      </h3>
                      <span className="text-[10px] sm:text-[11px] text-gray-400 font-medium block">
                        Update catalog details, barcode identification & role pricing
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditProductModalOpen(false);
                      setEditingProductData(null);
                    }}
                    className="w-8 h-8 rounded-full bg-gray-100 hover:bg-pink-100 text-gray-500 hover:text-[#C2477A] flex items-center justify-center transition-colors cursor-pointer shrink-0"
                    title="Close"
                  >
                    <X size={16} />
                  </button>
                </div>

                {/* Body */}
                <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-5 sm:px-6 py-4 sm:py-5 space-y-4 text-xs">
                  {/* Centralized Product Image Manager */}
                  <ImageField
                    label="Product Image"
                    sublabel="Live in User App. Drag & drop, paste (Ctrl+V), browse Google, or enter URL."
                    value={editingProductData.image}
                    onChange={(newUrl) => setEditingProductData(prev => ({ ...prev, image: newUrl }))}
                    folder="products"
                    filenamePrefix="prod"
                    entityName={editingProductData.name || editingProductData.brandName || 'Product'}
                  />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="sm:col-span-2">
                      <label className="block text-gray-800 font-bold mb-1.5 flex items-center gap-1.5">
                        <span>Product Name</span>
                        <span className="text-[#C2477A]">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={editingProductData.name}
                        onChange={(e) => setEditingProductData({ ...editingProductData, name: e.target.value })}
                        className="w-full p-3 rounded-xl border border-pink-100/80 outline-none focus:border-[#C2477A] focus:ring-2 focus:ring-[#C2477A]/20 bg-white font-medium shadow-2xs text-gray-900 transition-all text-xs"
                      />
                    </div>

                    <div>
                      <label className="block text-gray-800 font-bold mb-1.5">Brand Partner</label>
                      <SearchableSelect
                        options={brands}
                        value={editingProductData.brandName}
                        onChange={(selectedName, selectedObj) => {
                          const selected = selectedObj || brands.find(b => b.name === selectedName);
                          setEditingProductData({
                            ...editingProductData,
                            brandName: selectedName,
                            brandId: selected?.id || editingProductData.brandId
                          });
                        }}
                        placeholder="Select Brand Partner..."
                        searchPlaceholder="Search brand..."
                        emptyMessage="No brands found"
                        labelKey="name"
                        valueKey="name"
                      />
                    </div>

                    {/* Barcode Entry & Scanning for Edit Product */}
                    <div className="sm:col-span-2 space-y-2 p-3.5 rounded-2xl bg-gradient-to-br from-[#FFF2F5]/70 to-pink-50/40 border border-pink-100">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                        <label className="text-gray-900 font-extrabold flex items-center gap-1.5 text-xs">
                          <Barcode size={16} className="text-[#C2477A]" />
                          <span>Product Barcode Number</span>
                          <span className="text-[#C2477A] font-black">*</span>
                        </label>
                        <div className="flex items-center gap-2">
                          {editBarcodeStatus.isChecking && (
                            <span className="inline-flex items-center gap-1 text-[10.5px] font-semibold text-gray-500">
                              <Loader2 size={11} className="animate-spin text-[#C2477A]" />
                              <span>Verifying barcode...</span>
                            </span>
                          )}
                          {!editBarcodeStatus.isChecking && editBarcodeStatus.formatError && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-100/90 px-2.5 py-0.5 rounded-full border border-amber-300">
                              <AlertCircle size={10} /> Invalid Format
                            </span>
                          )}
                          {!editBarcodeStatus.isChecking && !editBarcodeStatus.formatError && editBarcodeStatus.checkedBarcode && !editBarcodeStatus.exists && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-100/90 px-2.5 py-0.5 rounded-full border border-emerald-300">
                              <CheckCircle2 size={10} /> Unique & Verified
                            </span>
                          )}
                          {!editBarcodeStatus.isChecking && editBarcodeStatus.checkedBarcode && editBarcodeStatus.exists && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-700 bg-rose-100/90 px-2.5 py-0.5 rounded-full border border-rose-300">
                              <AlertCircle size={10} /> Duplicate Barcode
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Input Row: Manual Barcode Input + Scan Barcode Button */}
                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
                        <div className="relative flex-1">
                          <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                            <Barcode size={15} className="text-gray-400" />
                          </div>
                          <input
                            type="text"
                            required
                            placeholder="Type or paste barcode number (e.g. 8901030383792)"
                            value={editingProductData.barcode}
                            onChange={(e) => setEditingProductData({ ...editingProductData, barcode: e.target.value })}
                            className={`w-full pl-10 pr-9 py-2.5 rounded-xl border font-mono text-xs font-semibold outline-none transition-all shadow-2xs ${
                              editBarcodeStatus.exists
                                ? 'border-rose-400 bg-rose-50/50 text-rose-950 focus:border-rose-500 focus:ring-2 focus:ring-rose-200'
                                : editBarcodeStatus.formatError
                                ? 'border-amber-400 bg-amber-50/40 text-amber-950 focus:border-amber-500 focus:ring-2 focus:ring-amber-200'
                                : !editBarcodeStatus.isChecking && editBarcodeStatus.checkedBarcode && !editBarcodeStatus.exists
                                ? 'border-emerald-400 bg-emerald-50/30 text-emerald-950 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200'
                                : 'border-pink-200 bg-white text-gray-900 focus:border-[#C2477A] focus:ring-2 focus:ring-[#C2477A]/20'
                            }`}
                          />
                          {editingProductData.barcode && (
                            <button
                              type="button"
                              onClick={() => setEditingProductData({ ...editingProductData, barcode: '' })}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer p-0.5"
                              title="Clear barcode"
                            >
                              <X size={14} />
                            </button>
                          )}
                        </div>

                        {/* Scan Barcode Button */}
                        <button
                          type="button"
                          onClick={() => {
                            setActiveBarcodeTarget('edit');
                            setIsBarcodeScannerOpen(true);
                          }}
                          className="px-4 py-2.5 rounded-xl font-extrabold text-xs flex items-center justify-center gap-2 bg-gradient-to-r from-[#C2477A] to-[#E25586] hover:from-[#b83760] hover:to-[#C2477A] text-white shadow-xs hover:shadow-sm cursor-pointer transition-all active:scale-[0.98] shrink-0"
                          title="Scan product barcode with camera"
                        >
                          <ScanBarcode size={16} />
                          <span>{editingProductData.barcode ? 'Scan Again' : 'Scan Barcode'}</span>
                        </button>
                      </div>

                      {/* Real-time Status Alert Messages */}
                      {editBarcodeStatus.formatError && (
                        <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 flex items-start gap-2 text-[11px] text-amber-800 animate-fade-in font-medium">
                          <AlertCircle size={15} className="text-amber-600 shrink-0 mt-0.5" />
                          <div>
                            <span className="font-extrabold text-amber-900">Invalid Barcode Format: </span>
                            <span>{editBarcodeStatus.formatError}</span>
                          </div>
                        </div>
                      )}

                      {editBarcodeStatus.exists && (
                        <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-2 text-[11px] text-rose-800 animate-fade-in font-medium">
                          <AlertCircle size={15} className="text-rose-600 shrink-0 mt-0.5" />
                          <div className="flex-1">
                            <span className="font-extrabold text-rose-900">Duplicate Barcode Detected: </span>
                            <span>
                              This barcode already belongs to another product ({editBarcodeStatus.matchedProduct?.name ? <strong className="font-bold">"{editBarcodeStatus.matchedProduct.name}"</strong> : 'another product'}). Duplicate barcodes cannot be saved.
                            </span>
                          </div>
                        </div>
                      )}

                      {!editBarcodeStatus.isChecking && !editBarcodeStatus.formatError && editBarcodeStatus.checkedBarcode && !editBarcodeStatus.exists && (
                        <div className="p-2 rounded-xl bg-emerald-50/90 border border-emerald-200 flex items-center gap-2 text-[11px] text-emerald-800 animate-fade-in font-medium">
                          <CheckCircle2 size={14} className="text-emerald-600 shrink-0" />
                          <span>
                            Barcode verified: <strong className="font-mono">{editBarcodeStatus.checkedBarcode}</strong> is unique to this product.
                          </span>
                        </div>
                      )}
                    </div>

                  {/* Role-Based Discount Pricing Matrix (All 4 Roles) */}
                  <div className="sm:col-span-2">
                    <RolePricingMatrix
                      basePrice={editingProductData.mrp}
                      onBasePriceChange={handleEditProductMrpChange}
                      rolePrices={{
                        generalPrice: editingProductData.generalPrice,
                        salonPrice: editingProductData.salonPrice,
                        artistPrice: editingProductData.artistPrice,
                        beauticianPrice: editingProductData.beauticianPrice
                      }}
                      onRolePriceChange={(rolePriceKey, priceVal) => {
                        setEditingProductData(prev => ({
                          ...prev,
                          [rolePriceKey]: priceVal
                        }));
                      }}
                      discountPercentages={editProductDiscounts}
                      onDiscountPercentageChange={(roleKey, pctVal) => {
                        setEditProductDiscounts(prev => ({
                          ...prev,
                          [roleKey]: pctVal
                        }));
                      }}
                      showBasePriceInput={true}
                      title="Role-Based Discount Pricing Matrix (All 4 Roles)"
                    />
                  </div>
                </div>

                {/* Per-Product Quantity Discount Tiers Manager (All 4 Roles) */}
                <div className="p-4 sm:p-5">
                  <RoleQuantityTiersManager
                    tiers={editingProductData.quantityTiers}
                    onChange={(updatedTiers) => setEditingProductData(prev => ({ ...prev, quantityTiers: updatedTiers }))}
                    product={{
                      ...editingProductData,
                      discountPercentages: editProductDiscounts
                    }}
                    showSaveButton={false}
                    allowClose={false}
                    title="Per-Product Quantity Discount Tiers"
                    subtitle="Configure independent tiers for General User, Salon Owner, Makeup Artist, and Beautician"
                  />
                </div>

                {/* Dynamic Product Variants Section */}
                {(() => {
                  const productVariants = editingProductData.shades || [];
                  const hasVariants = productVariants.length > 0;
                  const suggestions = getProductAttributeSuggestions({
                    category: editingProductData.category,
                    subcategory: editingProductData.subcategory,
                    productName: editingProductData.name
                  });
                  const isColorVariantActive = editProductActiveAttributes.some(attr => /shade|colour|color/i.test(attr));

                  // Available suggested attributes that are not yet active
                  const inactiveSuggestions = (suggestions.suggested || [])
                    .filter(attr => !editProductActiveAttributes.includes(attr));

                  const handleAttrValChange = (attrName, val) => {
                    setEditVariantDraft(prev => {
                      const updatedAttrs = { ...prev.attributes, [attrName]: val };
                      const autoName = Object.values(updatedAttrs).filter(Boolean).join(' - ');
                      return {
                        ...prev,
                        attributes: updatedAttrs,
                        name: autoName || prev.name
                      };
                    });
                  };

                  const handleAddVariantSubmit = () => {
                    const enteredValues = Object.values(editVariantDraft.attributes).filter(Boolean);
                    const vName = (editVariantDraft.name || enteredValues.join(' - ') || '').trim();
                    if (!vName && enteredValues.length === 0) {
                      alert('Please specify variant attribute values (e.g. Size, Volume) or a variant title.');
                      return;
                    }

                    const baseMrp = editVariantDraft.price ? Number(editVariantDraft.price) : Number(editingProductData.mrp || 0);
                    const salonPct = Number(editProductDiscounts.salon || 0);
                    const artistPct = Number(editProductDiscounts.artist || 0);
                    const beauticianPct = Number(editProductDiscounts.beautician || 0);

                    const salonPrice = salonPct > 0 ? Math.max(0, Math.round(baseMrp * (1 - salonPct / 100))) : Number(editingProductData.salonPrice || baseMrp);
                    const artistPrice = artistPct > 0 ? Math.max(0, Math.round(baseMrp * (1 - artistPct / 100))) : Number(editingProductData.artistPrice || baseMrp);
                    const beauticianPrice = beauticianPct > 0 ? Math.max(0, Math.round(baseMrp * (1 - beauticianPct / 100))) : Number(editingProductData.beauticianPrice || baseMrp);

                    const newVariant = {
                      id: 'var_' + Date.now(),
                      name: vName || `Variant ${productVariants.length + 1}`,
                      attributes: { ...editVariantDraft.attributes },
                      hexColor: isColorVariantActive ? (editVariantDraft.hexColor || '#C2477A') : undefined,
                      mrp: baseMrp,
                      generalPrice: baseMrp,
                      salonPrice,
                      artistPrice,
                      beauticianPrice,
                      priceOverride: editVariantDraft.price ? Number(editVariantDraft.price) : null,
                      barcode: (editVariantDraft.barcode || '').trim(),
                      active: true,
                      discountPercentages: { ...editProductDiscounts },
                      quantityTiers: getDefaultQuantityTiers()
                    };

                    setEditingProductData(prev => ({
                      ...prev,
                      shades: [...(prev.shades || []), newVariant]
                    }));

                    // Reset draft
                    setEditVariantDraft({
                      name: '',
                      attributes: {},
                      hexColor: '#C2477A',
                      price: '',
                      barcode: ''
                    });
                  };

                  return (
                    <div className="p-4 sm:p-5 pt-0">
                      {!hasVariants && !showAddVariantForm ? (
                        /* Clean "No variants configured" state */
                        <div className="p-5 sm:p-6 rounded-2xl bg-white border border-[#FCE4EC] shadow-2xs text-center space-y-3">
                          <div className="w-11 h-11 rounded-2xl bg-[#FFF5F8] text-[#C2477A] border border-pink-100 flex items-center justify-center mx-auto shadow-2xs">
                            <Layers size={22} />
                          </div>
                          <div className="space-y-1">
                            <h4 className="font-extrabold text-xs sm:text-sm text-gray-900 tracking-wide uppercase">
                              No Variants Configured
                            </h4>
                            <p className="text-[11px] text-gray-500 font-medium max-w-md mx-auto leading-relaxed">
                              This product is currently configured as a single standalone item with base catalog pricing (₹{editingProductData.mrp || 0} MRP). No shade, size, volume, or formula variants are attached.
                            </p>
                          </div>
                          <div className="pt-1.5 flex justify-center">
                            <button
                              type="button"
                              onClick={() => {
                                setShowAddVariantForm(true);
                                if (editProductActiveAttributes.length === 0) {
                                  setEditProductActiveAttributes(suggestions.defaultAutoSelect && suggestions.defaultAutoSelect.length > 0 ? suggestions.defaultAutoSelect : ['Size']);
                                }
                              }}
                              className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#C2477A] to-[#E25586] hover:from-[#b83760] hover:to-[#C2477A] text-white font-bold text-xs shadow-xs hover:shadow-sm cursor-pointer transition-all active:scale-95 flex items-center gap-1.5"
                            >
                              <Plus size={14} />
                              <span>Configure Product Variants</span>
                            </button>
                          </div>
                        </div>
                      ) : (
                        /* Dynamic Variants Management Card */
                        <div className="p-4 rounded-2xl bg-[#FFF5F8]/60 border border-[#FCE4EC]/80 space-y-3.5">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <span className="font-extrabold text-xs text-[#C2477A] uppercase tracking-wider flex items-center gap-1.5">
                                <Layers size={14} /> Product Variants ({productVariants.length})
                              </span>
                              <span className="text-[10px] text-gray-400 font-medium hidden sm:inline">
                                • Configured variant attributes & role pricing
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() => setShowAddVariantForm(prev => !prev)}
                              className="px-3 py-1.5 rounded-xl bg-white hover:bg-pink-50 text-[#C2477A] font-bold text-[11px] border border-pink-200 transition-all flex items-center gap-1 cursor-pointer self-start sm:self-auto active:scale-95 shadow-2xs"
                            >
                              {showAddVariantForm ? <X size={12} /> : <Plus size={12} />}
                              <span>{showAddVariantForm ? 'Close Add Form' : '+ Add Variant'}</span>
                            </button>
                          </div>

                          {/* Existing Variants List */}
                          {hasVariants && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                              {productVariants.map((shade, idx) => {
                                const shadeMrp = shade.mrp !== undefined && shade.mrp !== '' ? shade.mrp : (shade.priceOverride || editingProductData.mrp || 0);
                                const tiersCount = getTotalQuantityTiersCount(shade.quantityTiers);
                                const isColor = Boolean(
                                  shade.hexColor &&
                                  ((shade.attributes && Object.keys(shade.attributes).some(k => /shade|color|colour/i.test(k))) ||
                                   /makeup|lipstick|lip|nail|foundation/i.test(editingProductData.category || ''))
                                );

                                return (
                                  <div key={shade.id || idx} className="flex items-center justify-between p-2.5 bg-white border border-[#FCE4EC]/80 rounded-xl shadow-2xs gap-2">
                                    <div className="flex items-center gap-2.5 min-w-0">
                                      {/* Indicator: swatch if color variant, image thumbnail if available, or index badge */}
                                      {isColor ? (
                                        <span
                                          className="w-5 h-5 rounded-full border border-gray-200 shadow-xs shrink-0"
                                          style={{ background: shade.hexColor || '#C2477A' }}
                                        />
                                      ) : shade.image ? (
                                        <img
                                          src={shade.image}
                                          alt={shade.name}
                                          className="w-7 h-7 rounded-lg object-cover border border-pink-100 shrink-0"
                                        />
                                      ) : (
                                        <span className="w-6 h-6 rounded-lg bg-[#FFF5F8] text-[#C2477A] border border-pink-200 flex items-center justify-center text-[10px] font-black shrink-0">
                                          #{idx + 1}
                                        </span>
                                      )}
                                      <div className="min-w-0">
                                        <div className="text-xs font-bold text-gray-900 truncate">{shade.name}</div>
                                        {/* Dynamic Attribute Pills */}
                                        {shade.attributes && Object.keys(shade.attributes).length > 0 && (
                                          <div className="flex flex-wrap items-center gap-1 mt-0.5">
                                            {Object.entries(shade.attributes).map(([attrK, attrV]) => (
                                              <span key={attrK} className="px-1.5 py-0.2 rounded bg-pink-50/80 border border-pink-100 text-[#C2477A] text-[9.5px] font-bold">
                                                {attrK}: <strong className="text-gray-800 font-bold">{attrV}</strong>
                                              </span>
                                            ))}
                                          </div>
                                        )}
                                        <div className="text-[10px] text-gray-500 font-semibold flex items-center gap-1.5 flex-wrap mt-0.5">
                                          <span className="text-[#C2477A] font-bold">₹{shadeMrp} MRP</span>
                                          <span>•</span>
                                          <span className="text-amber-700 font-bold">{tiersCount} Tiers</span>
                                          {shade.barcode && (
                                            <>
                                              <span>•</span>
                                              <span className="font-mono text-[9px] text-gray-400 flex items-center gap-0.5">
                                                <Barcode size={9} /> {shade.barcode}
                                              </span>
                                            </>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-1.5 shrink-0">
                                      <button
                                        type="button"
                                        onClick={() => handleOpenShadePricing(shade, editingProductData, 'edit')}
                                        className="px-2.5 py-1 rounded-lg bg-[#FFF5F8] hover:bg-[#C2477A] text-[#C2477A] hover:text-white font-bold text-[10.5px] border border-[#FCE4EC] transition-all flex items-center gap-1 cursor-pointer active:scale-95"
                                        title="Configure role pricing & quantity discount tiers for this variant"
                                      >
                                        <BadgePercent size={11} />
                                        <span>Pricing & Tiers</span>
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => setEditingProductData(prev => ({ ...prev, shades: (prev.shades || []).filter((_, i) => i !== idx) }))}
                                        className="w-6 h-6 rounded-lg bg-rose-50 text-rose-500 hover:bg-rose-100 flex items-center justify-center cursor-pointer transition-colors"
                                        title="Remove variant"
                                      >
                                        <X size={12} />
                                      </button>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}

                          {/* Dynamic Add Variant Section */}
                          {showAddVariantForm && (
                            <div className="p-3.5 rounded-xl bg-white border border-[#FCE4EC] shadow-2xs space-y-3 animate-fade-in">
                              {/* Attributes Selection Bar */}
                              <div className="space-y-1.5 pb-2.5 border-b border-pink-100/60">
                                <div className="flex items-center justify-between">
                                  <label className="text-[10px] font-black text-gray-700 uppercase tracking-wider flex items-center gap-1">
                                    <Tag size={11} className="text-[#C2477A]" /> Configured Variant Attributes
                                  </label>
                                  <span className="text-[10px] text-gray-400">
                                    {editProductActiveAttributes.length} active attribute{editProductActiveAttributes.length === 1 ? '' : 's'}
                                  </span>
                                </div>
                                <div className="flex flex-wrap items-center gap-1.5">
                                  {/* Active Attribute Chips */}
                                  {editProductActiveAttributes.map(attr => (
                                    <span
                                      key={attr}
                                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#FFF5F8] text-[#C2477A] border border-[#FCE4EC] font-bold text-[10.5px]"
                                    >
                                      <span>{attr}</span>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setEditProductActiveAttributes(prev => prev.filter(a => a !== attr));
                                          setEditVariantDraft(prev => {
                                            const updated = { ...prev.attributes };
                                            delete updated[attr];
                                            return { ...prev, attributes: updated };
                                          });
                                        }}
                                        className="hover:text-rose-600 cursor-pointer ml-0.5"
                                        title={`Remove ${attr}`}
                                      >
                                        <X size={10} />
                                      </button>
                                    </span>
                                  ))}

                                  {/* Inactive Category Attribute Suggestions */}
                                  {inactiveSuggestions.map(attr => (
                                    <button
                                      key={attr}
                                      type="button"
                                      onClick={() => setEditProductActiveAttributes(prev => [...prev, attr])}
                                      className="px-2 py-0.5 rounded-lg bg-gray-50 hover:bg-pink-50 text-gray-600 hover:text-[#C2477A] border border-dashed border-gray-200 hover:border-pink-300 font-semibold text-[10px] cursor-pointer transition-colors"
                                      title={`Add ${attr} attribute to this product`}
                                    >
                                      + {attr}
                                    </button>
                                  ))}

                                  {/* Add Custom Attribute Name Button */}
                                  {!showCustomAttrInput ? (
                                    <button
                                      type="button"
                                      onClick={() => setShowCustomAttrInput(true)}
                                      className="px-2 py-0.5 rounded-lg bg-gray-50 hover:bg-gray-100 text-gray-500 font-semibold text-[10px] border border-gray-200 cursor-pointer transition-colors"
                                    >
                                      + Custom...
                                    </button>
                                  ) : (
                                    <div className="flex items-center gap-1">
                                      <input
                                        type="text"
                                        placeholder="Attribute name (e.g. Formula)"
                                        value={customAttributeInput}
                                        onChange={(e) => setCustomAttributeInput(e.target.value)}
                                        onKeyDown={(e) => {
                                          if (e.key === 'Enter') {
                                            e.preventDefault();
                                            const val = customAttributeInput.trim();
                                            if (val && !editProductActiveAttributes.includes(val)) {
                                              setEditProductActiveAttributes(prev => [...prev, val]);
                                            }
                                            setCustomAttributeInput('');
                                            setShowCustomAttrInput(false);
                                          }
                                        }}
                                        className="p-1 px-2 text-[10px] font-bold rounded-lg border border-pink-300 outline-none w-28 bg-white"
                                        autoFocus
                                      />
                                      <button
                                        type="button"
                                        onClick={() => {
                                          const val = customAttributeInput.trim();
                                          if (val && !editProductActiveAttributes.includes(val)) {
                                            setEditProductActiveAttributes(prev => [...prev, val]);
                                          }
                                          setCustomAttributeInput('');
                                          setShowCustomAttrInput(false);
                                        }}
                                        className="p-1 px-2 rounded-lg bg-[#C2477A] text-white text-[10px] font-bold cursor-pointer"
                                      >
                                        Add
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setCustomAttributeInput('');
                                          setShowCustomAttrInput(false);
                                        }}
                                        className="p-1 text-gray-400 hover:text-gray-600 cursor-pointer"
                                      >
                                        <X size={12} />
                                      </button>
                                    </div>
                                  )}
                                </div>
                              </div>

                              {/* Form Inputs: Dynamic Attributes & Variant Info */}
                              <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-end">
                                {/* Dynamically render input for each active attribute */}
                                {editProductActiveAttributes.map(attr => (
                                  <div
                                    key={attr}
                                    className={
                                      editProductActiveAttributes.length === 1
                                        ? "sm:col-span-4"
                                        : editProductActiveAttributes.length === 2
                                        ? "sm:col-span-3"
                                        : "sm:col-span-3"
                                    }
                                  >
                                    <label className="block text-[10px] font-bold text-gray-700 mb-1">
                                      {attr} <span className="text-[#C2477A]">*</span>
                                    </label>
                                    <input
                                      type="text"
                                      placeholder={getDynamicAttributePlaceholder(attr)}
                                      value={editVariantDraft.attributes[attr] || ''}
                                      onChange={(e) => handleAttrValChange(attr, e.target.value)}
                                      className="w-full p-2.5 rounded-xl border border-[#FCE4EC]/80 outline-none focus:border-[#C2477A] bg-white font-medium text-gray-900 text-xs shadow-xs"
                                    />
                                  </div>
                                ))}

                                {/* ONLY show Swatch Color if Shade/Color is an active attribute */}
                                {isColorVariantActive && (
                                  <div className="sm:col-span-3">
                                    <label className="block text-[10px] font-bold text-gray-700 mb-1">Swatch Color</label>
                                    <div className="flex items-center gap-1.5">
                                      <input
                                        type="color"
                                        value={editVariantDraft.hexColor}
                                        onChange={(e) => {
                                          const hex = e.target.value;
                                          const autoName = getBeautyShadeName ? getBeautyShadeName(hex) : '';
                                          setEditVariantDraft(prev => ({
                                            ...prev,
                                            hexColor: hex,
                                            name: autoName || prev.name
                                          }));
                                        }}
                                        className="w-9 h-9 rounded-lg border border-[#FCE4EC] cursor-pointer shrink-0 p-0.5"
                                      />
                                      <input
                                        type="text"
                                        placeholder="#C2477A"
                                        value={editVariantDraft.hexColor}
                                        onChange={(e) => setEditVariantDraft(prev => ({ ...prev, hexColor: e.target.value }))}
                                        className="w-full p-2 rounded-xl border border-[#FCE4EC]/80 outline-none focus:border-[#C2477A] bg-white font-mono text-[10px] font-bold text-gray-700 shadow-xs"
                                      />
                                    </div>
                                  </div>
                                )}

                                {/* Variant Title / Name input */}
                                <div className={isColorVariantActive ? "sm:col-span-3" : "sm:col-span-4"}>
                                  <label className="block text-[10px] font-bold text-gray-700 mb-1">Variant Title *</label>
                                  <input
                                    type="text"
                                    placeholder="e.g. 50ml Gel"
                                    value={editVariantDraft.name}
                                    onChange={(e) => setEditVariantDraft(prev => ({ ...prev, name: e.target.value }))}
                                    className="w-full p-2.5 rounded-xl border border-[#FCE4EC]/80 outline-none focus:border-[#C2477A] bg-white font-medium text-gray-900 text-xs shadow-xs"
                                  />
                                </div>

                                {/* MRP (₹) */}
                                <div className="sm:col-span-2">
                                  <label className="block text-[10px] font-bold text-gray-700 mb-1">MRP (₹)</label>
                                  <input
                                    type="number"
                                    placeholder={`₹${editingProductData.mrp || 0}`}
                                    value={editVariantDraft.price}
                                    onChange={(e) => setEditVariantDraft(prev => ({ ...prev, price: e.target.value }))}
                                    className="w-full p-2.5 rounded-xl border border-[#FCE4EC]/80 outline-none focus:border-[#C2477A] bg-white font-medium text-gray-900 text-xs shadow-xs"
                                  />
                                </div>

                                <div className="sm:col-span-3 flex items-end">
                                  <button
                                    type="button"
                                    onClick={handleAddVariantSubmit}
                                    className="w-full h-9 bg-gradient-to-r from-[#C2477A] to-[#E25586] hover:from-[#b83760] hover:to-[#C2477A] text-white rounded-xl flex items-center justify-center gap-1 font-bold text-xs shadow-xs active:scale-95 cursor-pointer"
                                    title="Add variant"
                                  >
                                    <Plus size={14} />
                                    <span>Add Variant</span>
                                  </button>
                                  </div>
                                </div>
                              </div>
                            )}
                        </div>
                      )}
                    </div>
                  );
                })()}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between px-5 sm:px-6 py-3.5 sm:py-4 border-t border-pink-100/80 bg-gray-50/90 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditProductModalOpen(false);
                      setEditingProductData(null);
                    }}
                    className="px-4 py-2.5 rounded-xl bg-white hover:bg-gray-200 text-gray-700 font-bold text-xs border border-gray-200 transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={editBarcodeStatus.exists || !!editBarcodeStatus.formatError || editBarcodeStatus.isChecking}
                    className={`px-5 py-2.5 rounded-xl font-extrabold text-xs flex items-center gap-2 shadow-xs transition-all ${
                      editBarcodeStatus.exists || !!editBarcodeStatus.formatError || editBarcodeStatus.isChecking
                        ? 'bg-gray-200 text-gray-400 cursor-not-allowed border border-gray-300'
                        : 'bg-[#C2477A] hover:bg-[#b83760] text-white cursor-pointer active:scale-[0.98]'
                    }`}
                  >
                    <Save size={14} />
                    <span>Save Changes</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Live Barcode Scanner Modal */}
        <BarcodeScannerModal
          isOpen={isBarcodeScannerOpen}
          onClose={() => setIsBarcodeScannerOpen(false)}
          onSelectBarcode={handleBarcodeScanned}
          checkBarcodeInSupabase={checkBarcodeInSupabase}
          excludeProductId={activeBarcodeTarget === 'edit' ? editingProductData?.id : null}
        />

        {/* Shade Variant-Level Pricing & Quantity Discount Tiers Modal */}
        <ShadePricingModal
          isOpen={shadePricingModalConfig.isOpen}
          onClose={() => setShadePricingModalConfig(prev => ({ ...prev, isOpen: false }))}
          shade={shadePricingModalConfig.shade}
          parentProduct={shadePricingModalConfig.parentProduct}
          onSave={handleSaveShadePricing}
        />
        {/* Delete Product / Variant Confirmation Modal */}
        {isDeleteProductModalOpen && productToDelete && (() => {
          const hasVariants = productToDelete.shades && Array.isArray(productToDelete.shades) && productToDelete.shades.length > 0;
          const targetImage = deleteModeChoice === 'variant' && selectedVariantToDelete?.image
            ? selectedVariantToDelete.image
            : (productToDelete.image || '');
          const targetName = deleteModeChoice === 'variant' && selectedVariantToDelete
            ? `${productToDelete.name} — ${selectedVariantToDelete.name}`
            : productToDelete.name;

          return (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fade-in">
              <div className="bg-white rounded-3xl border border-pink-100 shadow-2xl w-full max-w-md p-6 relative overflow-hidden animate-scale-up">
                {/* Modal Header */}
                <div className="flex items-center justify-between pb-3.5 mb-4 border-b border-pink-100/70">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold shadow-2xs border border-rose-100">
                      <Trash2 size={20} />
                    </div>
                    <div>
                      <h3 className="font-extrabold text-base text-gray-900 tracking-wide uppercase">
                        {deleteModeChoice === 'variant' ? 'Delete this variant?' : 'Delete this product?'}
                      </h3>
                      <span className="text-[11px] text-gray-400 font-medium block">
                        Permanent deletion from catalog & user mobile app
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      if (isDeletingProduct) return;
                      setIsDeleteProductModalOpen(false);
                      setProductToDelete(null);
                    }}
                    className="w-8 h-8 rounded-full bg-gray-100 hover:bg-pink-100 text-gray-500 hover:text-[#C2477A] flex items-center justify-center transition-colors cursor-pointer"
                  >
                    <X size={16} />
                  </button>
                </div>

                {/* Product Card with Thumbnail Image & Name */}
                <div className="p-3.5 rounded-2xl bg-[#FFF8FA] border border-pink-100/80 flex items-center gap-3.5 mb-4">
                  <div className="w-16 h-16 rounded-xl overflow-hidden bg-white border border-pink-200 shrink-0 shadow-2xs">
                    <img
                      src={targetImage}
                      alt={targetName}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.style.display = 'none';
                      }}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-[10px] font-black uppercase text-[#C2477A] tracking-wider block">
                      {productToDelete.brandName || 'Brand Item'}
                    </span>
                    <h4 className="font-extrabold text-xs text-gray-900 truncate mt-0.5">
                      {targetName}
                    </h4>
                    <div className="flex items-center gap-2 mt-1 text-[10.5px] text-gray-500">
                      {productToDelete.barcode && (
                        <span className="font-mono bg-white px-1.5 py-0.5 rounded border border-pink-100 text-gray-700">
                          {productToDelete.barcode}
                        </span>
                      )}
                      <span className="font-bold text-gray-900">
                        ₹{deleteModeChoice === 'variant' && selectedVariantToDelete?.mrp ? selectedVariantToDelete.mrp : (productToDelete.mrp ?? 0)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Variant Choice Options (When product has variants) */}
                {hasVariants && (
                  <div className="mb-4 space-y-2 p-3 rounded-2xl bg-gray-50 border border-gray-200/70">
                    <label className="text-[11px] font-black uppercase tracking-wider text-gray-700 block">
                      Deletion Scope:
                    </label>
                    <div className="space-y-1.5">
                      <label className="flex items-center gap-2 p-2 rounded-xl bg-white border border-gray-200 cursor-pointer hover:border-pink-300 transition-colors">
                        <input
                          type="radio"
                          name="deleteModeChoice"
                          value="full"
                          checked={deleteModeChoice === 'full'}
                          onChange={() => setDeleteModeChoice('full')}
                          className="accent-[#C2477A]"
                        />
                        <span className="text-xs font-bold text-gray-900">
                          Delete entire product family ({productToDelete.shades.length} variants)
                        </span>
                      </label>

                      <label className="flex items-center gap-2 p-2 rounded-xl bg-white border border-gray-200 cursor-pointer hover:border-pink-300 transition-colors">
                        <input
                          type="radio"
                          name="deleteModeChoice"
                          value="variant"
                          checked={deleteModeChoice === 'variant'}
                          onChange={() => setDeleteModeChoice('variant')}
                          className="accent-[#C2477A]"
                        />
                        <span className="text-xs font-bold text-gray-900">
                          Delete only a specific variant
                        </span>
                      </label>
                    </div>

                    {deleteModeChoice === 'variant' && (
                      <div className="mt-2 pt-2 border-t border-gray-200">
                        <label className="text-[10.5px] font-bold text-gray-600 block mb-1">
                          Select variant to remove:
                        </label>
                        <select
                          value={selectedVariantToDelete?.id || selectedVariantToDelete?.name || ''}
                          onChange={(e) => {
                            const found = productToDelete.shades.find(s => (s.id || s.name) === e.target.value);
                            if (found) setSelectedVariantToDelete(found);
                          }}
                          className="w-full p-2 bg-white rounded-xl border border-gray-300 text-xs font-medium text-gray-900 outline-none focus:border-[#C2477A]"
                        >
                          {productToDelete.shades.map((s, idx) => (
                            <option key={s.id || idx} value={s.id || s.name}>
                              {s.name} {s.code ? `(${s.code})` : ''} - ₹{s.mrp || productToDelete.mrp}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>
                )}

                {/* Warning Notification Banner */}
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-[11px] font-medium mb-5 space-y-1">
                  <div className="font-bold flex items-center gap-1.5 text-rose-900">
                    <AlertCircle size={13} />
                    <span>Permanent Deletion Warning</span>
                  </div>
                  <p>
                    {deleteModeChoice === 'full'
                      ? 'This will immediately purge this product and all associated images stored in Supabase Storage. The item will disappear from user search, categories, and catalogs immediately.'
                      : 'This variant will be permanently removed from this product and its dedicated image files will be purged from storage.'}
                  </p>
                </div>

                {/* Actions Button */}
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    disabled={isDeletingProduct}
                    onClick={() => {
                      setIsDeleteProductModalOpen(false);
                      setProductToDelete(null);
                    }}
                    className="w-1/2 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2.5 rounded-xl font-bold transition-all text-xs cursor-pointer disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={isDeletingProduct}
                    onClick={handleConfirmDeleteProduct}
                    className="w-1/2 bg-rose-600 hover:bg-rose-700 text-white py-2.5 rounded-xl font-bold shadow-sm hover:shadow-md transition-all active:scale-[0.99] flex items-center justify-center gap-1.5 cursor-pointer text-xs disabled:opacity-50"
                  >
                    {isDeletingProduct ? (
                      <>
                        <Loader2 size={14} className="animate-spin" />
                        <span>Deleting...</span>
                      </>
                    ) : (
                      <>
                        <Trash2 size={14} />
                        <span>Yes, Delete</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          );
        })()}

        {/* Floating Success Toast for Status Updates */}
        {dashboardToast && (
          <div className="fixed bottom-6 right-6 z-50 animate-fade-in bg-gray-900/95 backdrop-blur-md text-white px-4 py-3 rounded-2xl shadow-xl border border-gray-700/50 flex items-center gap-2.5 text-xs font-semibold">
            <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
            <span>{dashboardToast}</span>
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
