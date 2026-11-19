import React, { useState } from 'react';
import {
  Store,
  Power,
  CreditCard,
  QrCode,
  Truck,
  Package,
  Layers,
  Sparkles,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Eye,
  SlidersHorizontal,
  ChevronDown,
  ChevronUp,
  MapPin,
  Clock
} from 'lucide-react';
import { useAdmin } from '../../context/AdminContext';

export default function GeneralDashboardSettings({ onToast }) {
  const adminCtx = useAdmin() || {};
  const {
    generalSettings,
    updateGeneralSettings,
    homeSectionVisibility,
    toggleHomeSectionVisibility,
    resetHomeSectionVisibility,
    refreshData,
    currentAuthUser
  } = adminCtx;

  const [activeTab, setActiveTab] = useState('operations'); // 'operations' | 'app_display'
  const [isSaving, setIsSaving] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);

  // Read current operational settings safely
  const isAcceptingOrders = generalSettings?.operations?.isAcceptingOrders !== false;
  const acceptCod = generalSettings?.payments?.acceptCod !== false;
  const acceptUpi = generalSettings?.payments?.acceptUpi !== false;
  const freeDeliveryThreshold = generalSettings?.delivery?.freeDeliveryThreshold ?? 500;
  const enableFreeDelivery = generalSettings?.delivery?.enableFreeDeliveryThreshold !== false;
  const estimatedDeliveryTime = generalSettings?.delivery?.estimatedTimeText || 'Same Day / 24-48 Hours';
  const maxCodAmount = generalSettings?.payments?.maxCodAmount ?? 5000;

  // Local state for numeric / text inputs
  const [localFreeThreshold, setLocalFreeThreshold] = useState(freeDeliveryThreshold);
  const [localMaxCod, setLocalMaxCod] = useState(maxCodAmount);
  const [localEstimatedTime, setLocalEstimatedTime] = useState(estimatedDeliveryTime);

  const showToast = (message, type = 'success') => {
    if (typeof onToast === 'function') {
      onToast({ message, type });
    }
  };

  // Toggle Store Online / Taking Orders
  const handleToggleStoreOpen = async () => {
    setIsSaving(true);
    try {
      const nextState = !isAcceptingOrders;
      await updateGeneralSettings({
        storeOpen: nextState,
        operations: {
          ...(generalSettings?.operations || {}),
          isAcceptingOrders: nextState,
          pauseOrdersNotice: nextState
            ? 'We are open and delivering!'
            : 'We are temporarily not taking new orders. Please check back shortly.'
        }
      });
      showToast(nextState ? 'Store is now ONLINE and taking orders!' : 'Store is now PAUSED (customers will see notice).');
    } catch (err) {
      showToast('Failed to update store status: ' + err.message, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // Toggle COD Acceptance
  const handleToggleCod = async () => {
    setIsSaving(true);
    try {
      const nextState = !acceptCod;
      await updateGeneralSettings({
        payments: {
          ...(generalSettings?.payments || {}),
          acceptCod: nextState,
          allowCod: nextState
        }
      });
      showToast(nextState ? 'Cash on Delivery (COD) enabled across store.' : 'Cash on Delivery disabled (prepaid/UPI only).');
    } catch (err) {
      showToast('Failed to update COD: ' + err.message, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // Toggle Doorstep UPI QR
  const handleToggleUpi = async () => {
    setIsSaving(true);
    try {
      const nextState = !acceptUpi;
      await updateGeneralSettings({
        payments: {
          ...(generalSettings?.payments || {}),
          acceptUpi: nextState,
          allowUpi: nextState
        }
      });
      showToast(nextState ? 'Doorstep UPI ID payment enabled for riders.' : 'Doorstep UPI disabled.');
    } catch (err) {
      showToast('Failed to update UPI settings: ' + err.message, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // Toggle Free Delivery Threshold
  const handleToggleFreeDelivery = async () => {
    setIsSaving(true);
    try {
      const nextState = !enableFreeDelivery;
      await updateGeneralSettings({
        delivery: {
          ...(generalSettings?.delivery || {}),
          enableFreeDeliveryThreshold: nextState
        }
      });
      showToast(nextState ? 'Free shipping threshold activated.' : 'Free shipping threshold deactivated.');
    } catch (err) {
      showToast('Failed to update delivery settings: ' + err.message, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // Save numeric delivery & COD thresholds
  const handleSaveDeliveryAndLimits = async () => {
    setIsSaving(true);
    try {
      await updateGeneralSettings({
        delivery: {
          ...(generalSettings?.delivery || {}),
          freeDeliveryThreshold: Number(localFreeThreshold) || 500,
          estimatedTimeText: localEstimatedTime
        },
        payments: {
          ...(generalSettings?.payments || {}),
          maxCodAmount: Number(localMaxCod) || 5000
        }
      });
      showToast('Store operational settings saved successfully.');
    } catch (err) {
      showToast('Failed to save settings: ' + err.message, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // Force Full Sync
  const handleForceSync = async () => {
    setIsSyncing(true);
    try {
      if (typeof refreshData === 'function') {
        await refreshData();
      }
      showToast('Store catalog, active orders, and settings re-synchronized!');
    } catch (err) {
      showToast('Sync error: ' + err.message, 'error');
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="bg-white border border-pink-100/90 rounded-2xl shadow-xs overflow-hidden transition-all">
      {/* Header Bar */}
      <div className="p-4 sm:p-5 bg-gradient-to-r from-pink-50/60 via-white to-pink-50/30 border-b border-pink-100/70 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white text-[#D81B60] border border-pink-200/80 flex items-center justify-center shadow-2xs shrink-0">
            <SlidersHorizontal size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-sm font-extrabold text-gray-900 tracking-tight">
                Store Operations & Dashboard Controls
              </h3>
              <span
                className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                  isAcceptingOrders
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : 'bg-rose-50 text-rose-700 border-rose-200 animate-pulse'
                }`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${isAcceptingOrders ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                {isAcceptingOrders ? 'Live & Accepting Orders' : 'Store Paused'}
              </span>
            </div>
            <p className="text-[11px] text-gray-500 mt-0.5">
              Live operational controls, checkout policies, and customer mobile app display options
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
          <button
            type="button"
            onClick={handleForceSync}
            disabled={isSyncing}
            className="px-3 py-1.5 rounded-xl border border-pink-200 bg-white hover:bg-pink-50 text-gray-700 hover:text-[#D81B60] text-xs font-bold transition-all shadow-2xs flex items-center gap-1.5 cursor-pointer active:scale-95 disabled:opacity-50"
            title="Force refresh database & cache"
          >
            <RefreshCw size={13} className={isSyncing ? 'animate-spin text-[#D81B60]' : ''} />
            <span>{isSyncing ? 'Syncing...' : 'Sync Data'}</span>
          </button>

          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1.5 rounded-xl border border-pink-200 bg-white hover:bg-pink-50 text-gray-500 hover:text-[#D81B60] transition-colors cursor-pointer"
            title={isExpanded ? 'Collapse settings' : 'Expand settings'}
          >
            {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="p-4 sm:p-5 space-y-4">
          {/* Sub Navigation Tabs */}
          <div className="flex items-center gap-2 border-b border-pink-100/80 pb-3">
            <button
              type="button"
              onClick={() => setActiveTab('operations')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'operations'
                  ? 'bg-[#D81B60] text-white shadow-2xs'
                  : 'bg-gray-100/70 text-gray-600 hover:bg-pink-50 hover:text-[#D81B60]'
              }`}
            >
              <Store size={14} />
              <span>General Store Controls</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('app_display')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'app_display'
                  ? 'bg-[#D81B60] text-white shadow-2xs'
                  : 'bg-gray-100/70 text-gray-600 hover:bg-pink-50 hover:text-[#D81B60]'
              }`}
            >
              <Eye size={14} />
              <span>Customer App Display Settings</span>
            </button>
          </div>

          {/* TAB 1: GENERAL STORE CONTROLS */}
          {activeTab === 'operations' && (
            <div className="space-y-4 animate-fade-in">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {/* 1. Master Store Open Toggle */}
                <div
                  className={`p-3.5 rounded-2xl border transition-all flex flex-col justify-between ${
                    isAcceptingOrders
                      ? 'bg-emerald-50/40 border-emerald-200'
                      : 'bg-rose-50/50 border-rose-200'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold ${
                        isAcceptingOrders ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                      }`}>
                        <Power size={16} />
                      </div>
                      <div>
                        <span className="text-xs font-black text-gray-900 block">Accepting Orders</span>
                        <span className="text-[10.5px] text-gray-500">Live store customer orders</span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleToggleStoreOpen}
                      disabled={isSaving}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        isAcceptingOrders ? 'bg-emerald-600' : 'bg-gray-300'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                          isAcceptingOrders ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>
                  <div className="text-[10px] font-semibold text-gray-500 mt-2.5">
                    {isAcceptingOrders ? '● Store online in mobile app' : '⏸ Customers see store maintenance notice'}
                  </div>
                </div>

                {/* 2. Cash on Delivery (COD) Switch */}
                <div className="p-3.5 rounded-2xl border border-pink-100 bg-white flex flex-col justify-between">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl bg-pink-100/70 text-[#D81B60] flex items-center justify-center font-bold">
                        <CreditCard size={16} />
                      </div>
                      <div>
                        <span className="text-xs font-black text-gray-900 block">Cash on Delivery</span>
                        <span className="text-[10.5px] text-gray-500">COD at doorstep</span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleToggleCod}
                      disabled={isSaving}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        acceptCod ? 'bg-[#D81B60]' : 'bg-gray-300'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                          acceptCod ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>
                  <div className="text-[10px] font-semibold text-gray-500 mt-2.5">
                    {acceptCod ? `● Active (Limit: ₹${localMaxCod.toLocaleString('en-IN')})` : '○ Prepaid & UPI Only'}
                  </div>
                </div>

                {/* 3. Doorstep UPI Transfer */}
                <div className="p-3.5 rounded-2xl border border-pink-100 bg-white flex flex-col justify-between">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl bg-pink-100/70 text-[#D81B60] flex items-center justify-center font-bold">
                        <CreditCard size={16} />
                      </div>
                      <div>
                        <span className="text-xs font-black text-gray-900 block">Rider UPI Transfer</span>
                        <span className="text-[10.5px] text-gray-500">Doorstep UPI ID payment</span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleToggleUpi}
                      disabled={isSaving}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        acceptUpi ? 'bg-[#D81B60]' : 'bg-gray-300'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                          acceptUpi ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>
                  <div className="text-[10px] font-semibold text-gray-500 mt-2.5">
                    {acceptUpi ? '● Official UPI ID displayed in Rider App' : '○ Doorstep UPI disabled'}
                  </div>
                </div>
              </div>

              {/* Thresholds & Delivery Promise Row */}
              <div className="p-3.5 rounded-2xl bg-gray-50/60 border border-pink-100/70 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 flex-1">
                  <div>
                    <label className="text-[10.5px] font-bold text-gray-700 block mb-1">
                      Free Shipping Min. Order (₹)
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={localFreeThreshold}
                      onChange={(e) => setLocalFreeThreshold(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-xl border border-pink-200 bg-white text-xs font-bold text-gray-900 outline-none focus:border-[#D81B60]"
                      placeholder="500"
                    />
                  </div>

                  <div>
                    <label className="text-[10.5px] font-bold text-gray-700 block mb-1">
                      Max COD Limit (₹)
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={localMaxCod}
                      onChange={(e) => setLocalMaxCod(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-xl border border-pink-200 bg-white text-xs font-bold text-gray-900 outline-none focus:border-[#D81B60]"
                      placeholder="5000"
                    />
                  </div>

                  <div>
                    <label className="text-[10.5px] font-bold text-gray-700 block mb-1">
                      Estimated Dispatch Promise
                    </label>
                    <input
                      type="text"
                      value={localEstimatedTime}
                      onChange={(e) => setLocalEstimatedTime(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-xl border border-pink-200 bg-white text-xs font-bold text-gray-900 outline-none focus:border-[#D81B60]"
                      placeholder="Same Day / 24-48 Hours"
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleSaveDeliveryAndLimits}
                  disabled={isSaving}
                  className="px-4 py-2 rounded-xl bg-[#D81B60] hover:bg-[#b83760] text-white font-bold text-xs shadow-2xs transition-all cursor-pointer shrink-0 self-end sm:self-center"
                >
                  {isSaving ? 'Saving...' : 'Save Settings'}
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: CUSTOMER APP DISPLAY CONTROLS */}
          {activeTab === 'app_display' && (
            <div className="space-y-3 animate-fade-in">
              <div className="flex items-center justify-between pb-1">
                <span className="text-xs font-bold text-gray-800">
                  Customer Mobile App Section Visibility
                </span>
                <button
                  type="button"
                  onClick={resetHomeSectionVisibility}
                  className="text-xs font-bold text-[#D81B60] hover:underline cursor-pointer flex items-center gap-1"
                >
                  <Sparkles size={12} />
                  <span>Reset All to Visible</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {[
                  {
                    key: 'branchBar',
                    title: 'Branch Selector Bar',
                    desc: 'Top header showing branch and location picker',
                    icon: MapPin
                  },
                  {
                    key: 'heroPromoBanner',
                    title: 'Hero Perks Banner',
                    desc: 'Promotional discount and perk banner on home screen',
                    icon: Sparkles
                  },
                  {
                    key: 'shopCategories',
                    title: 'Categories Strip',
                    desc: 'Horizontal scrollable category circles',
                    icon: Layers
                  },
                  {
                    key: 'featuredBrands',
                    title: 'Featured Brands Carousel',
                    desc: 'Continuous marquee of verified beauty brands',
                    icon: Store
                  },
                  {
                    key: 'bestSellers',
                    title: 'Best Sellers Product Grid',
                    desc: '2-column catalog product recommendations grid',
                    icon: Package
                  }
                ].map((item) => {
                  const isVisible = (homeSectionVisibility && homeSectionVisibility[item.key] !== false) ?? true;
                  const IconComp = item.icon;

                  return (
                    <div
                      key={item.key}
                      className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                        isVisible
                          ? 'bg-white border-pink-200/90 shadow-2xs'
                          : 'bg-gray-50/70 border-gray-200 opacity-60'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div
                          className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                            isVisible ? 'bg-pink-100/70 text-[#D81B60]' : 'bg-gray-200 text-gray-500'
                          }`}
                        >
                          <IconComp size={16} />
                        </div>
                        <div className="min-w-0">
                          <span className="text-xs font-bold text-gray-900 block truncate">{item.title}</span>
                          <span className="text-[10.5px] text-gray-500 block truncate">{item.desc}</span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => toggleHomeSectionVisibility && toggleHomeSectionVisibility(item.key)}
                        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                          isVisible ? 'bg-[#D81B60]' : 'bg-gray-300'
                        }`}
                      >
                        <span
                          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                            isVisible ? 'translate-x-5' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
