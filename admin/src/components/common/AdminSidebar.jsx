import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  LayoutGrid,
  Eye,
  Image as ImageIcon,
  FolderPlus,
  Store,
  Package,
  Table,
  Sparkles,
  ShoppingBag,
  ShieldCheck,
  ShieldAlert,
  Users,
  User,
  Building2,
  Search,
  ShoppingCart,
  Award,
  DollarSign,
  Percent,
  FileText,
  Clock,
  SlidersHorizontal,
  LogOut,
  ChevronDown,
  Menu,
  X,
  Sparkle
} from 'lucide-react';

/**
 * Salbeau Luxury Theme Badge helper
 */
const getBadgeStyles = (variant = 'neutral') => {
  switch (variant) {
    case 'amber':
      return 'bg-amber-50 text-amber-700 border border-amber-200/90 font-bold';
    case 'brand':
      return 'bg-[#FFF0F4] text-[#C2477A] border border-[#FCD8E3] font-bold';
    case 'emerald':
      return 'bg-emerald-50 text-emerald-700 border border-emerald-200/90 font-bold';
    case 'purple':
      return 'bg-purple-50 text-purple-700 border border-purple-200/90 font-bold';
    case 'neutral':
    default:
      return 'bg-slate-100 text-slate-600 font-semibold';
  }
};

export const AdminSidebar = ({
  isSidebarCollapsed,
  toggleSidebar,
  activeTab,
  navigateToTab,
  isMobileDrawerOpen,
  setIsMobileDrawerOpen,
  onLogoutClick,
  currentAuthUser,
  // Real dynamic counts
  homeBanners = [],
  categories = [],
  brands = [],
  products = [],
  orders = [],
  employeeOperations = [],
  users = [],
  b2cUsersCount = 0,
  b2bUsersCount = 0,
  searchRequests = [],
  abandonedCarts = [],
  b2bPendingTotal = 0,
  b2bPendingSalon = 0,
  b2bPendingArtist = 0,
  b2bPendingBeautician = 0,
  employees = []
}) => {
  const [openSubmenus, setOpenSubmenus] = useState({
    users: true,
    'b2b-verification': false,
    employees: false
  });
  const [hoveredTooltip, setHoveredTooltip] = useState(null);

  // Auto-expand parent menus if a child route is currently active
  useEffect(() => {
    if (activeTab.startsWith('user') || activeTab.startsWith('users')) {
      setOpenSubmenus(prev => ({ ...prev, users: true }));
    }
    if (activeTab.startsWith('b2b-verification') || activeTab.startsWith('b2b_verification')) {
      setOpenSubmenus(prev => ({ ...prev, 'b2b-verification': true }));
    }
    if (activeTab.startsWith('employees')) {
      setOpenSubmenus(prev => ({ ...prev, employees: true }));
    }
  }, [activeTab]);

  // Handle Escape key to close mobile drawer
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isMobileDrawerOpen) {
        setIsMobileDrawerOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isMobileDrawerOpen, setIsMobileDrawerOpen]);

  // Precise Active Item Matcher
  const isItemActive = useCallback((itemId) => {
    if (!itemId) return false;
    if (itemId === 'dashboard') return activeTab === 'dashboard';
    if (itemId === 'dashboard_visibility') return activeTab === 'dashboard_visibility';
    if (itemId === 'home_banners') return activeTab === 'home_banners';
    if (itemId === 'categories') return activeTab === 'categories';
    if (itemId === 'add_brand') return activeTab === 'add_brand';
    if (itemId === 'products') return activeTab === 'products' || activeTab === 'products/new';
    if (itemId === 'products/bulk') return activeTab === 'products/bulk';
    if (itemId === 'attributes') return activeTab === 'attributes';
    if (itemId === 'order_updated') return activeTab === 'order_updated';
    if (itemId === 'approval_center') return activeTab === 'approval_center';
    if (itemId === 'users') return activeTab === 'user' || activeTab === 'users';
    if (itemId === 'users/b2c') return activeTab === 'users/b2c' || activeTab === 'user/b2c' || activeTab === 'user' || activeTab === 'users';
    if (itemId === 'users/b2b') return activeTab === 'users/b2b' || activeTab === 'user/b2b';
    if (itemId === 'search_requests') return activeTab === 'search_requests';
    if (itemId === 'abandoned_carts') return activeTab === 'abandoned_carts';
    if (itemId === 'b2b-verification') return activeTab === 'b2b-verification' || activeTab === 'b2b_verification';
    if (itemId === 'b2b-verification/salon') return activeTab === 'b2b-verification/salon' || activeTab === 'b2b_verification/salon';
    if (itemId === 'b2b-verification/makeup-artist') return activeTab === 'b2b-verification/makeup-artist' || activeTab === 'b2b_verification/makeup_artist';
    if (itemId === 'b2b-verification/beautician') return activeTab === 'b2b-verification/beautician' || activeTab === 'b2b_verification/beautician';
    if (itemId === 'cancel_fee') return activeTab === 'cancel_fee';
    if (itemId === 'pricing_rules') return activeTab === 'pricing_rules';
    if (itemId === 'employees') return activeTab === 'employees' || activeTab === 'employees/new';
    if (itemId === 'employees/activity') return activeTab === 'employees/activity';
    if (itemId === 'audit_trail') return activeTab === 'audit_trail';
    if (itemId === 'quick_panel') return activeTab === 'quick_panel';
    return activeTab === itemId;
  }, [activeTab]);

  // Computed Badge Values (Strictly from real application state)
  const activeBannersCount = useMemo(() => {
    return (homeBanners || []).filter(b => b.isActive !== false).length;
  }, [homeBanners]);

  const pendingApprovalsCount = useMemo(() => {
    return (employeeOperations || []).filter(op => op.status === 'pending').length;
  }, [employeeOperations]);

  const pendingSearchesCount = useMemo(() => {
    return (searchRequests || []).filter(r => !r.status || r.status === 'pending').length;
  }, [searchRequests]);

  const activeAbandonedCartsCount = useMemo(() => {
    return (abandonedCarts || []).filter(c => c.status === 'abandoned').length;
  }, [abandonedCarts]);

  const activeEmployeesCount = useMemo(() => {
    return (employees || []).filter(e => e.status === 'active').length;
  }, [employees]);

  // Master Reorganized Sidebar Navigation Definition
  const navSections = useMemo(() => [
    {
      title: 'OVERVIEW',
      items: [
        {
          id: 'dashboard',
          label: 'Dashboard',
          icon: LayoutGrid
        },
        {
          id: 'dashboard_visibility',
          label: 'Dashboard Visibility',
          icon: Eye
        }
      ]
    },
    {
      title: 'STORE MANAGEMENT',
      items: [
        {
          id: 'home_banners',
          label: 'Home Banners',
          icon: ImageIcon,
          badge: activeBannersCount > 0 ? `${activeBannersCount} Active` : null,
          badgeVariant: 'brand'
        },
        {
          id: 'categories',
          label: 'Categories',
          icon: FolderPlus,
          badge: (categories || []).length > 0 ? (categories || []).length : null,
          badgeVariant: 'emerald'
        },
        {
          id: 'add_brand',
          label: 'Brands',
          icon: Store,
          badge: (brands || []).length > 0 ? (brands || []).length : null,
          badgeVariant: 'neutral'
        }
      ]
    },
    {
      title: 'PRODUCT MANAGEMENT',
      items: [
        {
          id: 'products',
          label: 'Products',
          icon: Package,
          badge: (products || []).length > 0 ? (products || []).length : null,
          badgeVariant: 'neutral'
        },
        {
          id: 'attributes',
          label: 'Attributes Master',
          icon: Sparkles
        }
      ]
    },
    {
      title: 'ORDERS & APPROVALS',
      items: [
        {
          id: 'order_updated',
          label: 'Order Management',
          icon: ShoppingBag,
          badge: (orders || []).filter(o => o.status === 'placed' || o.status === 'pending').length || null,
          badgeVariant: 'amber'
        },
        {
          id: 'approval_center',
          label: 'Approval Center',
          icon: ShieldCheck,
          badge: pendingApprovalsCount > 0 ? pendingApprovalsCount : null,
          badgeVariant: 'amber'
        }
      ]
    },
    {
      title: 'CUSTOMER MANAGEMENT',
      items: [
        {
          id: 'users',
          label: 'Users',
          icon: Users,
          badge: (users || []).length > 0 ? (users || []).length : null,
          badgeVariant: 'brand',
          subItems: [
            {
              id: 'users/b2c',
              label: 'B2C Users',
              icon: User,
              badge: b2cUsersCount > 0 ? b2cUsersCount : null,
              badgeVariant: 'brand'
            },
            {
              id: 'users/b2b',
              label: 'B2B Users',
              icon: Building2,
              badge: b2bUsersCount > 0 ? b2bUsersCount : null,
              badgeVariant: 'purple'
            }
          ]
        },
        {
          id: 'search_requests',
          label: 'Customer Search Activity',
          icon: Search,
          badge: pendingSearchesCount > 0 ? pendingSearchesCount : null,
          badgeVariant: 'amber'
        },
        {
          id: 'abandoned_carts',
          label: 'Abandoned Carts',
          icon: ShoppingCart,
          badge: activeAbandonedCartsCount > 0 ? activeAbandonedCartsCount : null,
          badgeVariant: 'amber'
        }
      ]
    },
    {
      title: 'B2B VERIFICATIONS',
      items: [
        {
          id: 'b2b-verification',
          label: 'B2B Applications',
          icon: ShieldAlert,
          badge: b2bPendingTotal > 0 ? b2bPendingTotal : null,
          badgeVariant: 'amber',
          subItems: [
            {
              id: 'b2b-verification',
              label: 'All Applications',
              icon: ShieldAlert,
              badge: b2bPendingTotal > 0 ? b2bPendingTotal : null,
              badgeVariant: 'amber'
            },
            {
              id: 'b2b-verification/salon',
              label: 'Salon Verification',
              icon: Store,
              badge: b2bPendingSalon > 0 ? b2bPendingSalon : null,
              badgeVariant: 'amber'
            },
            {
              id: 'b2b-verification/makeup-artist',
              label: 'Makeup Artist',
              icon: Sparkles,
              badge: b2bPendingArtist > 0 ? b2bPendingArtist : null,
              badgeVariant: 'amber'
            },
            {
              id: 'b2b-verification/beautician',
              label: 'Beautician',
              icon: Award,
              badge: b2bPendingBeautician > 0 ? b2bPendingBeautician : null,
              badgeVariant: 'amber'
            }
          ]
        }
      ]
    },
    {
      title: 'PRICING & REVENUE',
      items: [
        {
          id: 'cancel_fee',
          label: 'Cancel Fee Policy',
          icon: DollarSign
        },
        {
          id: 'pricing_rules',
          label: 'Pricing & Volume Rules',
          icon: Percent
        }
      ]
    },
    {
      title: 'STAFF & GOVERNANCE',
      items: [
        {
          id: 'employees',
          label: 'Employees',
          icon: Users,
          badge: activeEmployeesCount > 0 ? activeEmployeesCount : null,
          badgeVariant: 'brand',
          subItems: [
            { id: 'employees', label: 'All Employees', icon: Users },
            { id: 'employees/activity', label: 'Employee Activity', icon: Clock }
          ]
        },
        {
          id: 'audit_trail',
          label: 'Audit Trail',
          icon: FileText
        }
      ]
    },
    {
      title: 'SYSTEM & QUICK ACCESS',
      items: [
        {
          id: 'quick_panel',
          label: 'Quick Panel',
          icon: SlidersHorizontal
        }
      ]
    }
  ], [
    activeBannersCount,
    categories,
    brands,
    products,
    orders,
    pendingApprovalsCount,
    users,
    b2cUsersCount,
    b2bUsersCount,
    pendingSearchesCount,
    activeAbandonedCartsCount,
    b2bPendingTotal,
    b2bPendingSalon,
    b2bPendingArtist,
    b2bPendingBeautician,
    activeEmployeesCount
  ]);

  // Role and Permission Filter
  const filteredNavSections = useMemo(() => {
    if (!currentAuthUser || currentAuthUser.role === 'admin') {
      return navSections;
    }
    const perms = currentAuthUser.permissions || {};
    return navSections.map(sec => {
      const filteredItems = sec.items.filter(item => {
        if (item.id === 'dashboard') return perms.dashboard?.enabled !== false;
        if (item.id === 'dashboard_visibility') return perms.settings?.enabled !== false;
        if (item.id === 'home_banners') return perms.settings?.enabled !== false || currentAuthUser?.role === 'admin';
        if (item.id === 'categories') return perms.categories?.enabled !== false;
        if (item.id === 'add_brand') return perms.brands?.enabled !== false;
        if (item.id === 'products' || item.id === 'attributes' || item.id === 'products/bulk') return perms.products?.enabled !== false;
        if (item.id === 'order_updated') return perms.orders?.enabled !== false;
        if (item.id === 'approval_center') return currentAuthUser?.role === 'admin' || perms.approvals?.enabled !== false;
        if (item.id === 'users') return perms.customers?.enabled !== false;
        if (item.id === 'search_requests') return perms.products?.enabled !== false || perms.customers?.enabled !== false;
        if (item.id === 'abandoned_carts') return perms.orders?.enabled !== false;
        if (item.id.startsWith('b2b')) return currentAuthUser?.role === 'admin' || perms.customers?.enabled !== false || perms.approvals?.enabled !== false;
        if (item.id === 'cancel_fee') return perms.payments?.enabled !== false;
        if (item.id === 'pricing_rules') return perms.offers?.enabled !== false;
        if (item.id === 'employees') return perms.employees?.enabled !== false;
        if (item.id === 'audit_trail') return currentAuthUser?.role === 'admin' || perms.employees?.enabled !== false;
        if (item.id === 'quick_panel') return true;
        return false;
      });
      return { ...sec, items: filteredItems };
    }).filter(sec => sec.items.length > 0);
  }, [navSections, currentAuthUser]);

  // Tooltip helper for collapsed sidebar
  const handleTooltipEnter = (e, label, badge) => {
    if (!isSidebarCollapsed) return;
    const rect = e.currentTarget.getBoundingClientRect();
    setHoveredTooltip({
      label,
      badge,
      top: rect.top + rect.height / 2,
      left: rect.right + 10
    });
  };

  const handleTooltipLeave = () => {
    setHoveredTooltip(null);
  };

  const toggleSubmenu = (itemId) => {
    setOpenSubmenus(prev => ({
      ...prev,
      [itemId]: !prev[itemId]
    }));
  };

  return (
    <>
      {/* ========================================================================= */}
      {/* 1. DESKTOP / TABLET RESPONSIVE SIDEBAR                                    */}
      {/* ========================================================================= */}
      <aside
        className={`hidden md:flex flex-col justify-between sticky top-0 h-screen max-h-screen bg-white border-r border-pink-100/70 shadow-xs flex-shrink-0 z-30 transition-all duration-300 ease-in-out select-none ${
          isSidebarCollapsed ? 'w-[72px] p-2' : 'w-[260px] p-3.5'
        }`}
        aria-label="Admin Navigation Sidebar"
      >
        <div className="flex flex-col flex-1 min-h-0">
          {/* Brand Header */}
          <div className={`shrink-0 flex items-center mb-3 pb-3 border-b border-pink-100/60 ${
            isSidebarCollapsed ? 'justify-center px-0' : 'justify-between px-1'
          }`}>
            {!isSidebarCollapsed ? (
              <div className="flex items-center gap-2 overflow-hidden">
                <span
                  style={{ fontFamily: "'Great Vibes', cursive" }}
                  className="text-2xl text-[#C2477A] font-normal tracking-wide leading-none select-none truncate"
                >
                  Salbeau
                </span>
                <span className="text-[10px] font-bold tracking-wider uppercase text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded-md">
                  Admin
                </span>
              </div>
            ) : (
              <div
                style={{ fontFamily: "'Great Vibes', cursive" }}
                className="text-2xl text-[#C2477A] font-bold select-none cursor-pointer"
                onClick={toggleSidebar}
                title="Expand sidebar"
              >
                S
              </div>
            )}

            <button
              type="button"
              onClick={toggleSidebar}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-[#C2477A] hover:bg-[#FFF5F8] transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-[#C2477A] focus-visible:outline-none shrink-0"
              title={isSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              aria-label={isSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              <Menu size={18} />
            </button>
          </div>

          {/* Scrollable Navigation Items with Coordinated Brand Scrollbar */}
          <nav
            id="admin-sidebar-nav"
            className={`space-y-3.5 overflow-y-auto flex-1 -mx-1 px-1 pr-1.5 pb-6 ${
              isSidebarCollapsed ? 'flex flex-col items-center' : ''
            }`}
            tabIndex={0}
            aria-label="Main Navigation Menu"
          >
            {filteredNavSections.map((section) => (
              <div key={section.title} className={isSidebarCollapsed ? 'w-full flex flex-col items-center mb-1' : 'mb-2.5'}>
                {/* Section Header */}
                {!isSidebarCollapsed ? (
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-2.5 py-1 mb-0.5 select-none">
                    {section.title}
                  </div>
                ) : (
                  <div className="w-6 border-b border-slate-100 my-1 opacity-70" />
                )}

                {/* Items in Section */}
                <div className={isSidebarCollapsed ? 'space-y-1 w-full flex flex-col items-center' : 'space-y-0.5'}>
                  {section.items.map((item) => {
                    const Icon = item.icon;
                    const isActive = isItemActive(item.id);
                    const hasSubItems = Array.isArray(item.subItems) && item.subItems.length > 0;
                    const isSubOpen = openSubmenus[item.id] || (hasSubItems && item.subItems.some(sub => isItemActive(sub.id)));
                    const tooltipBadge = item.badge || (hasSubItems ? item.subItems.find(s => isItemActive(s.id))?.label : null);

                    // --- Collapsed Sidebar Button ---
                    if (isSidebarCollapsed) {
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => {
                            if (hasSubItems) {
                              navigateToTab(item.subItems[0].id);
                              return;
                            }
                            navigateToTab(item.id);
                          }}
                          onMouseEnter={(e) => handleTooltipEnter(e, item.label, tooltipBadge)}
                          onMouseLeave={handleTooltipLeave}
                          className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all relative cursor-pointer group focus-visible:ring-2 focus-visible:ring-[#C2477A] focus-visible:outline-none ${
                            isActive
                              ? 'bg-[#FFF0F4] text-[#C2477A] shadow-2xs ring-1 ring-[#C2477A]/30 font-bold'
                              : 'text-slate-500 hover:bg-[#FFF5F8] hover:text-[#C2477A]'
                          }`}
                          aria-label={item.label}
                        >
                          <Icon size={18} className={`shrink-0 transition-transform ${isActive ? 'scale-105 text-[#C2477A]' : 'group-hover:scale-105'}`} />
                          {item.badge !== undefined && item.badge !== null && (
                            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#C2477A] ring-2 ring-white" />
                          )}
                        </button>
                      );
                    }

                    // --- Expanded Sidebar Item ---
                    return (
                      <div key={item.id} className="space-y-0.5">
                        <button
                          type="button"
                          onClick={() => {
                            if (hasSubItems) {
                              toggleSubmenu(item.id);
                              const isCurrentlyInside = item.subItems.some(sub => isItemActive(sub.id));
                              if (!isCurrentlyInside) {
                                navigateToTab(item.subItems[0].id);
                              }
                              return;
                            }
                            navigateToTab(item.id);
                          }}
                          aria-expanded={hasSubItems ? isSubOpen : undefined}
                          className={`w-full h-10 px-2.5 rounded-xl text-[13px] flex items-center justify-between transition-all cursor-pointer group focus-visible:ring-2 focus-visible:ring-[#C2477A] focus-visible:outline-none ${
                            isActive
                              ? 'bg-[#FFF0F4] text-[#C2477A] font-semibold shadow-2xs relative before:absolute before:left-0 before:top-2.5 before:bottom-2.5 before:w-1 before:bg-[#C2477A] before:rounded-r-full'
                              : 'text-slate-600 hover:bg-[#FFF5F8]/70 hover:text-[#C2477A]'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <Icon size={18} className={`shrink-0 transition-transform ${isActive ? 'scale-105 text-[#C2477A]' : 'text-slate-500 group-hover:scale-105 group-hover:text-[#C2477A]'}`} />
                            <span className="truncate">{item.label}</span>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            {item.badge !== undefined && item.badge !== null && (
                              <span className={`text-[10px] px-2 py-0.5 rounded-full tabular-nums shrink-0 ${getBadgeStyles(item.badgeVariant)}`}>
                                {item.badge}
                              </span>
                            )}
                            {hasSubItems && (
                              <ChevronDown
                                size={14}
                                className={`text-slate-400 transition-transform duration-200 ${isSubOpen ? 'rotate-180 text-[#C2477A]' : ''}`}
                              />
                            )}
                          </div>
                        </button>

                        {/* Submenu Accordion */}
                        {hasSubItems && isSubOpen && (
                          <div className="ml-3.5 pl-3 border-l-2 border-pink-100/90 space-y-0.5 py-0.5 animate-fade-in">
                            {item.subItems.map((sub) => {
                              const SubIcon = sub.icon || null;
                              const isSubActive = isItemActive(sub.id);
                              return (
                                <button
                                  key={sub.id}
                                  type="button"
                                  onClick={() => navigateToTab(sub.id)}
                                  className={`w-full h-8 px-2 rounded-lg text-xs flex items-center justify-between transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-[#C2477A] focus-visible:outline-none ${
                                    isSubActive
                                      ? 'bg-[#FFF5F8] text-[#C2477A] font-semibold'
                                      : 'text-slate-500 hover:bg-[#FFF5F8]/50 hover:text-[#C2477A]'
                                  }`}
                                >
                                  <div className="flex items-center gap-2 min-w-0">
                                    {SubIcon && <SubIcon size={13} className={`shrink-0 ${isSubActive ? 'text-[#C2477A]' : 'text-slate-400'}`} />}
                                    <span className="truncate">{sub.label}</span>
                                  </div>
                                  {sub.badge !== undefined && sub.badge !== null && (
                                    <span className={`text-[9.5px] px-1.5 py-0.2 rounded-full tabular-nums ${getBadgeStyles(sub.badgeVariant || item.badgeVariant)}`}>
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

        {/* Desktop Sidebar Persistent Footer */}
        <div className="shrink-0 pt-3 border-t border-pink-100/70 mt-auto bg-white">
          {!isSidebarCollapsed ? (
            <div className="space-y-2">
              <button
                type="button"
                onClick={onLogoutClick}
                className="w-full h-10 px-3 rounded-xl font-semibold text-xs text-rose-600 bg-rose-50/70 hover:bg-rose-100/80 border border-rose-100/80 flex items-center justify-between transition-all cursor-pointer shadow-2xs active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:outline-none"
                aria-label="Log Out of Admin Panel"
              >
                <div className="flex items-center gap-2">
                  <LogOut size={16} />
                  <span>Log Out</span>
                </div>
                <span className="text-[10px] text-slate-400 font-medium tracking-tight">
                  {currentAuthUser?.role === 'employee' ? 'Staff' : 'Admin'}
                </span>
              </button>

              <div className="flex items-center justify-between px-1.5 text-[11px] text-slate-400 font-medium">
                <span>Salbeau Store</span>
                <span className="flex items-center gap-1.5 text-emerald-600 font-semibold text-[10.5px]">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  v1.0.0
                </span>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <button
                type="button"
                onClick={onLogoutClick}
                onMouseEnter={(e) => handleTooltipEnter(e, 'Log Out', null)}
                onMouseLeave={handleTooltipLeave}
                className="w-10 h-10 rounded-xl text-rose-600 bg-rose-50/70 hover:bg-rose-100/80 border border-rose-100/80 flex items-center justify-center transition-all cursor-pointer shadow-2xs active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:outline-none"
                title="Log Out"
                aria-label="Log Out"
              >
                <LogOut size={16} />
              </button>
              <span className="text-[9.5px] text-slate-400 font-bold" title="Salbeau Admin v1.0.0">
                v1.0
              </span>
            </div>
          )}
        </div>
      </aside>

      {/* Floating Tooltip for Collapsed Mode */}
      {hoveredTooltip && isSidebarCollapsed && (
        <div
          role="tooltip"
          className="fixed z-[9999] pointer-events-none -translate-y-1/2 flex items-center transition-opacity duration-150 animate-fade-in"
          style={{ top: hoveredTooltip.top, left: hoveredTooltip.left }}
        >
          <div className="w-1.5 h-1.5 bg-slate-900 rotate-45 -mr-1 z-10" />
          <div className="bg-slate-900 text-white text-xs font-semibold px-2.5 py-1.5 rounded-lg shadow-xl flex items-center gap-2 border border-slate-700/60 whitespace-nowrap">
            <span>{hoveredTooltip.label}</span>
            {hoveredTooltip.badge !== undefined && hoveredTooltip.badge !== null && (
              <span className="text-[10px] bg-[#C2477A] text-white px-1.5 py-0.2 rounded-full font-bold">
                {hoveredTooltip.badge}
              </span>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. MOBILE DRAWER OVERLAY & SLIDE-OUT MENU                                  */}
      {/* ========================================================================= */}
      {isMobileDrawerOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex" role="dialog" aria-modal="true" aria-label="Mobile Navigation Menu">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity animate-fade-in"
            onClick={() => setIsMobileDrawerOpen(false)}
            aria-hidden="true"
          />

          {/* Drawer Surface */}
          <div className="relative w-[280px] max-w-[85vw] h-full bg-white shadow-2xl flex flex-col z-10 animate-slide-right select-none">
            {/* Mobile Header */}
            <div className="shrink-0 p-4 border-b border-pink-100/70 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span
                  style={{ fontFamily: "'Great Vibes', cursive" }}
                  className="text-2xl text-[#C2477A] font-normal tracking-wide"
                >
                  Salbeau
                </span>
                <span className="text-[10px] font-bold uppercase text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded-md">
                  Admin
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsMobileDrawerOpen(false)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                aria-label="Close navigation menu"
              >
                <X size={18} />
              </button>
            </div>

            {/* Mobile Scrollable Nav */}
            <nav className="flex-1 min-h-0 overflow-y-auto py-3 px-3 space-y-4" aria-label="Mobile Navigation List">
              {filteredNavSections.map((section) => (
                <div key={section.title} className="space-y-1">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-2.5 py-1 select-none">
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
                            type="button"
                            onClick={() => {
                              if (hasSubItems) {
                                toggleSubmenu(item.id);
                                return;
                              }
                              navigateToTab(item.id);
                              setIsMobileDrawerOpen(false);
                            }}
                            className={`w-full h-10 px-2.5 rounded-xl text-[13px] flex items-center justify-between transition-colors cursor-pointer ${
                              isActive
                                ? 'bg-[#FFF0F4] text-[#C2477A] font-semibold'
                                : 'text-slate-600 hover:bg-[#FFF5F8]/70 hover:text-[#C2477A]'
                            }`}
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <Icon size={18} className={`shrink-0 ${isActive ? 'text-[#C2477A]' : 'text-slate-500'}`} />
                              <span className="truncate">{item.label}</span>
                            </div>
                            <div className="flex items-center gap-1.5 shrink-0">
                              {item.badge !== undefined && item.badge !== null && (
                                <span className={`text-[10px] px-2 py-0.5 rounded-full tabular-nums ${getBadgeStyles(item.badgeVariant)}`}>
                                  {item.badge}
                                </span>
                              )}
                              {hasSubItems && (
                                <ChevronDown
                                  size={14}
                                  className={`text-slate-400 transition-transform ${isSubOpen ? 'rotate-180 text-[#C2477A]' : ''}`}
                                />
                              )}
                            </div>
                          </button>

                          {/* Mobile Submenu */}
                          {hasSubItems && isSubOpen && (
                            <div className="ml-3.5 pl-3 border-l-2 border-pink-100/90 space-y-0.5 py-1">
                              {item.subItems.map((sub) => {
                                const SubIcon = sub.icon || null;
                                const isSubActive = isItemActive(sub.id);
                                return (
                                  <button
                                    key={sub.id}
                                    type="button"
                                    onClick={() => {
                                      navigateToTab(sub.id);
                                      setIsMobileDrawerOpen(false);
                                    }}
                                    className={`w-full h-8 px-2 rounded-lg text-xs flex items-center justify-between transition-colors cursor-pointer ${
                                      isSubActive
                                        ? 'bg-[#FFF5F8] text-[#C2477A] font-semibold'
                                        : 'text-slate-500 hover:bg-[#FFF5F8]/50 hover:text-[#C2477A]'
                                    }`}
                                  >
                                    <div className="flex items-center gap-2 min-w-0">
                                      {SubIcon && <SubIcon size={13} className={`shrink-0 ${isSubActive ? 'text-[#C2477A]' : 'text-slate-400'}`} />}
                                      <span className="truncate">{sub.label}</span>
                                    </div>
                                    {sub.badge !== undefined && sub.badge !== null && (
                                      <span className={`text-[9.5px] px-1.5 py-0.2 rounded-full tabular-nums ${getBadgeStyles(sub.badgeVariant || item.badgeVariant)}`}>
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

            {/* Mobile Drawer Footer */}
            <div className="shrink-0 p-4 border-t border-pink-100/70 space-y-2.5 mt-auto bg-white">
              <button
                type="button"
                onClick={() => {
                  setIsMobileDrawerOpen(false);
                  onLogoutClick();
                }}
                className="w-full h-10 px-3 rounded-xl font-semibold text-xs text-rose-600 bg-rose-50/70 hover:bg-rose-100/80 border border-rose-100/80 flex items-center justify-between transition-all cursor-pointer shadow-2xs"
              >
                <div className="flex items-center gap-2">
                  <LogOut size={16} />
                  <span>Log Out</span>
                </div>
                <span className="text-[10px] text-slate-400 font-medium">
                  {currentAuthUser?.role === 'employee' ? 'Staff' : 'Admin'}
                </span>
              </button>
              <div className="text-[11px] text-slate-400 font-medium px-1 flex items-center justify-between">
                <span>Salbeau Store</span>
                <span className="text-[10px] text-emerald-600 font-semibold">v1.0.0</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AdminSidebar;
