import React, { useState, useEffect } from 'react';
import {
  SlidersHorizontal,
  Building2,
  Store,
  Truck,
  CreditCard,
  Bell,
  ShieldAlert,
  Save,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  QrCode,
  Sparkles,
  Percent,
  Check,
  Upload
} from 'lucide-react';
import ImageField from '../media/ImageField';
import PaymentSecurityGateModal from '../security/PaymentSecurityGateModal';
import Security2FASettingsPage from '../security/Security2FASettingsPage';
import { isPaymentSessionValid } from '../../utils/totpSecurityEngine';
import { Lock, ShieldCheck } from 'lucide-react';
import { useAdmin } from '../../context/AdminContext';

export const DEFAULT_GENERAL_SETTINGS = {
  storeName: 'Salbeau MakeUpStore',
  tagline: 'Luxury Beauty & Salon Cosmetics Store',
  supportEmail: 'contact@salbeau.com',
  supportPhone: '+91 98765 43210',
  headquartersAddress: 'VIP Road, C-Block, Visakhapatnam, Andhra Pradesh - 530003',
  gstin: '37AAAAA0000A1Z5',
  currency: '₹',
  delivery: {
    standardFee: 49,
    freeDeliveryThreshold: 499,
    estimatedTimeText: 'Same Day / 24-48 Hours',
    minOrderAmount: 99,
    maxItemsPerOrder: 50,
  },
  payments: {
    upiId: 'salbeau.store@okaxis',
    upiQrCodeUrl: '',
    acceptUpi: true,
    acceptCod: true,
    maxCodAmount: 5000,
  },
  storeOpen: true,
  announcement: {
    enabled: false,
    message: '✨ Welcome to Salbeau Luxury Cosmetics! Enjoy Free Shipping on orders above ₹499.',
  },
  policies: {
    graceWindowMinutes: 30,
    cancelFeeAmount: 0,
    allowSelfCancel: true,
    requireB2BVerification: true,
  }
};

export default function GeneralSettingsPage() {
  const adminContext = useAdmin() || {};
  const {
    generalSettings,
    updateGeneralSettings,
    uploadImage,
    currentAuthUser,
  } = adminContext;

  const [activeTab, setActiveTab] = useState('store_info'); // 'store_info' | 'delivery' | 'payments' | 'broadcast' | 'policies' | 'security_2fa'
  const [isUploadingQr, setIsUploadingQr] = useState(false);
  const [is2FAGateOpen, setIs2FAGateOpen] = useState(false);

  const handleTabSelect = (tabKey) => {
    if (tabKey === 'payments') {
      if (!isPaymentSessionValid(currentAuthUser?.email)) {
        setIs2FAGateOpen(true);
        return;
      }
    }
    setActiveTab(tabKey);
  };

  const normalizeSettings = (raw) => {
    if (!raw || typeof raw !== 'object') return DEFAULT_GENERAL_SETTINGS;
    return {
      ...DEFAULT_GENERAL_SETTINGS,
      ...raw,
      storeName: raw.storeName || raw.identity?.storeName || DEFAULT_GENERAL_SETTINGS.storeName,
      tagline: raw.tagline || raw.identity?.tagline || DEFAULT_GENERAL_SETTINGS.tagline,
      supportEmail: raw.supportEmail || raw.identity?.contactEmail || DEFAULT_GENERAL_SETTINGS.supportEmail,
      supportPhone: raw.supportPhone || raw.identity?.supportPhone || DEFAULT_GENERAL_SETTINGS.supportPhone,
      headquartersAddress: raw.headquartersAddress || raw.identity?.hqAddress || DEFAULT_GENERAL_SETTINGS.headquartersAddress,
      gstin: raw.gstin || raw.identity?.gstin || DEFAULT_GENERAL_SETTINGS.gstin,
      currency: raw.currency || raw.identity?.currencySymbol || DEFAULT_GENERAL_SETTINGS.currency,
      delivery: {
        ...DEFAULT_GENERAL_SETTINGS.delivery,
        ...(raw.delivery || {}),
        standardFee: raw.delivery?.standardFee ?? raw.delivery?.standardDeliveryFee ?? DEFAULT_GENERAL_SETTINGS.delivery.standardFee,
        freeDeliveryThreshold: raw.delivery?.freeDeliveryThreshold ?? DEFAULT_GENERAL_SETTINGS.delivery.freeDeliveryThreshold,
        estimatedTimeText: raw.delivery?.estimatedTimeText || raw.delivery?.estimatedDeliveryTime || DEFAULT_GENERAL_SETTINGS.delivery.estimatedTimeText,
        minOrderAmount: raw.delivery?.minOrderAmount ?? DEFAULT_GENERAL_SETTINGS.delivery.minOrderAmount,
        maxItemsPerOrder: raw.delivery?.maxItemsPerOrder ?? DEFAULT_GENERAL_SETTINGS.delivery.maxItemsPerOrder,
      },
      payments: {
        ...DEFAULT_GENERAL_SETTINGS.payments,
        ...(raw.payments || {}),
        upiId: raw.payments?.upiId || DEFAULT_GENERAL_SETTINGS.payments.upiId,
        acceptUpi: raw.payments?.acceptUpi ?? raw.payments?.allowUpi ?? DEFAULT_GENERAL_SETTINGS.payments.acceptUpi,
        acceptCod: raw.payments?.acceptCod ?? raw.payments?.allowCod ?? DEFAULT_GENERAL_SETTINGS.payments.acceptCod,
        maxCodAmount: raw.payments?.maxCodAmount ?? raw.payments?.maxCodLimit ?? DEFAULT_GENERAL_SETTINGS.payments.maxCodAmount,
      },
      storeOpen: raw.storeOpen ?? raw.operations?.isAcceptingOrders ?? DEFAULT_GENERAL_SETTINGS.storeOpen,
      announcement: {
        ...DEFAULT_GENERAL_SETTINGS.announcement,
        ...(raw.announcement || {}),
        enabled: raw.announcement?.enabled ?? raw.operations?.announcementEnabled ?? DEFAULT_GENERAL_SETTINGS.announcement.enabled,
        message: raw.announcement?.message || raw.operations?.announcementMessage || DEFAULT_GENERAL_SETTINGS.announcement.message,
      },
      policies: {
        ...DEFAULT_GENERAL_SETTINGS.policies,
        ...(raw.policies || {}),
        graceWindowMinutes: raw.policies?.graceWindowMinutes ?? raw.policies?.cancellationWindowMinutes ?? DEFAULT_GENERAL_SETTINGS.policies.graceWindowMinutes,
        cancelFeeAmount: raw.policies?.cancelFeeAmount ?? raw.policies?.cancellationFee ?? DEFAULT_GENERAL_SETTINGS.policies.cancelFeeAmount,
        allowSelfCancel: raw.policies?.allowSelfCancel ?? raw.policies?.allowCustomerSelfCancel ?? DEFAULT_GENERAL_SETTINGS.policies.allowSelfCancel,
        requireB2BVerification: raw.policies?.requireB2BVerification ?? DEFAULT_GENERAL_SETTINGS.policies.requireB2BVerification,
      }
    };
  };

  const [formData, setFormData] = useState(() => normalizeSettings(generalSettings));
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState('');

  // Sync state when context updates
  useEffect(() => {
    if (generalSettings && typeof generalSettings === 'object') {
      setFormData(normalizeSettings(generalSettings));
    }
  }, [generalSettings]);

  const handleChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    setSaveSuccess(false);
    setSaveError('');
  };

  const handleNestedChange = (parent, field, value) => {
    setFormData(prev => ({
      ...prev,
      [parent]: {
        ...(prev[parent] || {}),
        [field]: value
      }
    }));
    setSaveSuccess(false);
    setSaveError('');
  };

  const handleDirectQrUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setIsUploadingQr(true);
      setSaveError('');
      if (typeof uploadImage === 'function') {
        const url = await uploadImage(file, 'payment-proofs', 'store_merchant_upi_qr', 'PRODUCT');
        if (url) {
          handleNestedChange('payments', 'upiQrCodeUrl', url);
          return;
        }
      }
      // Direct local file reader fallback if needed
      const reader = new FileReader();
      reader.onload = (event) => {
        handleNestedChange('payments', 'upiQrCodeUrl', event.target.result);
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.warn('Direct QR upload storage warning:', err);
      const reader = new FileReader();
      reader.onload = (event) => {
        handleNestedChange('payments', 'upiQrCodeUrl', event.target.result);
      };
      reader.readAsDataURL(file);
    } finally {
      setIsUploadingQr(false);
      if (e.target) e.target.value = '';
    }
  };

  const handleSave = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    setIsSaving(true);
    setSaveError('');
    setSaveSuccess(false);

    try {
      const payload = {
        ...formData,
        identity: {
          storeName: formData?.storeName,
          tagline: formData?.tagline,
          contactEmail: formData?.supportEmail,
          supportPhone: formData?.supportPhone,
          hqAddress: formData?.headquartersAddress,
          gstin: formData?.gstin,
          currencySymbol: formData?.currency,
        },
        delivery: {
          ...formData?.delivery,
          standardDeliveryFee: Number(formData?.delivery?.standardFee),
          freeDeliveryThreshold: Number(formData?.delivery?.freeDeliveryThreshold),
          estimatedDeliveryTime: formData?.delivery?.estimatedTimeText,
          minOrderAmount: Number(formData?.delivery?.minOrderAmount),
          maxOrderItems: Number(formData?.delivery?.maxItemsPerOrder),
        },
        payments: {
          ...formData?.payments,
          allowCod: Boolean(formData?.payments?.acceptCod),
          allowUpi: Boolean(formData?.payments?.acceptUpi),
          upiId: formData?.payments?.upiId,
          upiQrCodeUrl: formData?.payments?.upiQrCodeUrl,
          maxCodLimit: Number(formData?.payments?.maxCodAmount),
        },
        operations: {
          isAcceptingOrders: Boolean(formData?.storeOpen),
          pauseOrdersNotice: 'We are temporarily not taking new orders. Please check back shortly.',
          announcementEnabled: Boolean(formData?.announcement?.enabled),
          announcementMessage: formData?.announcement?.message,
        },
        policies: {
          ...formData?.policies,
          cancellationWindowMinutes: Number(formData?.policies?.graceWindowMinutes),
          cancellationFee: Number(formData?.policies?.cancelFeeAmount),
          allowCustomerSelfCancel: Boolean(formData?.policies?.allowSelfCancel),
          requireB2BVerification: Boolean(formData?.policies?.requireB2BVerification),
        }
      };

      if (typeof updateGeneralSettings === 'function') {
        await updateGeneralSettings(payload);
      }
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      setSaveError(err.message || 'An unexpected error occurred while saving.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetToDefault = () => {
    if (window.confirm('Reset all store settings to default Salbeau configurations?')) {
      setFormData(DEFAULT_GENERAL_SETTINGS);
      setSaveSuccess(false);
      setSaveError('');
    }
  };

  const currentData = formData || DEFAULT_GENERAL_SETTINGS;

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto animate-fade-in pb-12">
      {/* ── HEADER BANNER ── */}
      <div className="bg-white rounded-3xl border border-gray-200/80 p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-[#C2477A]/10 text-[#C2477A] flex items-center justify-center font-bold">
              <SlidersHorizontal size={22} />
            </div>
            <div>
              <h1 className="text-xl font-black text-gray-900 tracking-tight">General Settings</h1>
              <p className="text-xs text-gray-500 font-medium">
                Store Configuration, Global Rules, Delivery Rates, UPI Credentials & App Broadcasts
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleResetToDefault}
            className="px-3.5 py-2 text-xs font-bold text-gray-600 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <RotateCcw size={14} />
            <span>Reset Defaults</span>
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="px-5 py-2.5 bg-[#C2477A] hover:bg-[#a63965] text-white text-xs font-bold rounded-xl shadow-sm transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            {isSaving ? (
              <>
                <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Saving...</span>
              </>
            ) : (
              <>
                <Save size={14} />
                <span>Save All Changes</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* ── ALERTS ── */}
      {saveSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center gap-3 text-emerald-800 text-xs font-bold animate-fade-in">
          <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />
          <span>General settings saved successfully and synchronized across customer app and admin panel!</span>
        </div>
      )}

      {saveError && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 flex items-center gap-3 text-rose-800 text-xs font-bold animate-fade-in">
          <AlertCircle size={18} className="text-rose-600 shrink-0" />
          <span>{saveError}</span>
        </div>
      )}

      {/* ── CONFIGURATION TABS ── */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        <button
          type="button"
          onClick={() => setActiveTab('store_info')}
          className={`px-4 py-2.5 rounded-2xl text-xs font-black transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeTab === 'store_info'
              ? 'bg-[#C2477A] text-white shadow-sm'
              : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
          }`}
        >
          <Store size={15} />
          <span>Store Identity</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('delivery')}
          className={`px-4 py-2.5 rounded-2xl text-xs font-black transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeTab === 'delivery'
              ? 'bg-[#C2477A] text-white shadow-sm'
              : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
          }`}
        >
          <Truck size={15} />
          <span>Delivery Rates & Rules</span>
        </button>

        <button
          type="button"
          onClick={() => handleTabSelect('payments')}
          className={`px-4 py-2.5 rounded-2xl text-xs font-black transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeTab === 'payments'
              ? 'bg-[#C2477A] text-white shadow-sm'
              : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
          }`}
        >
          <CreditCard size={15} />
          <span>Payments & UPI Gateway</span>
          <span className="px-1.5 py-0.5 rounded-md bg-purple-100 text-purple-900 text-[9px] font-black uppercase tracking-wider flex items-center gap-1">
            <Lock size={9} />
            <span>2FA</span>
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('security_2fa')}
          className={`px-4 py-2.5 rounded-2xl text-xs font-black transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeTab === 'security_2fa'
              ? 'bg-[#C2477A] text-white shadow-sm'
              : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
          }`}
        >
          <ShieldCheck size={15} />
          <span>Security & 2FA</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('broadcast')}
          className={`px-4 py-2.5 rounded-2xl text-xs font-black transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeTab === 'broadcast'
              ? 'bg-[#C2477A] text-white shadow-sm'
              : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
          }`}
        >
          <Bell size={15} />
          <span>Store Status & Announcements</span>
          {currentData?.announcement?.enabled && (
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('policies')}
          className={`px-4 py-2.5 rounded-2xl text-xs font-black transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeTab === 'policies'
              ? 'bg-[#C2477A] text-white shadow-sm'
              : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
          }`}
        >
          <ShieldAlert size={15} />
          <span>Policies & Cancellations</span>
        </button>
      </div>

      {/* ── TAB CONTENT CONTAINERS ── */}
      <div className="bg-white rounded-3xl border border-gray-200/80 p-6 md:p-8 shadow-sm">
        {/* 1. STORE IDENTITY TAB */}
        {activeTab === 'store_info' && (
          <div className="space-y-6 max-w-3xl">
            <div>
              <h2 className="text-base font-black text-gray-900">Store & Business Information</h2>
              <p className="text-xs text-gray-500 font-medium">
                Official store credentials displayed on Customer Invoices, Support Helpdesk, and App Headers.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Store / Business Name *</label>
                <input
                  type="text"
                  value={currentData?.storeName || ''}
                  onChange={e => handleChange('storeName', e.target.value)}
                  placeholder="e.g. Salbeau MakeUpStore"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs font-bold text-gray-800 outline-none focus:border-[#C2477A]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Tagline / Slogan</label>
                <input
                  type="text"
                  value={currentData?.tagline || ''}
                  onChange={e => handleChange('tagline', e.target.value)}
                  placeholder="e.g. Luxury Beauty & Professional Cosmetics"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs font-bold text-gray-800 outline-none focus:border-[#C2477A]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Customer Support Email *</label>
                <input
                  type="email"
                  value={currentData?.supportEmail || ''}
                  onChange={e => handleChange('supportEmail', e.target.value)}
                  placeholder="contact@salbeau.com"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs font-bold text-gray-800 outline-none focus:border-[#C2477A]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Customer Support Helpline *</label>
                <input
                  type="text"
                  value={currentData?.supportPhone || ''}
                  onChange={e => handleChange('supportPhone', e.target.value)}
                  placeholder="+91 98765 43210"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs font-bold text-gray-800 outline-none focus:border-[#C2477A]"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-gray-700 mb-1">Headquarters / Registered Address</label>
                <textarea
                  rows={2}
                  value={currentData?.headquartersAddress || ''}
                  onChange={e => handleChange('headquartersAddress', e.target.value)}
                  placeholder="Enter corporate / central store address"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs font-bold text-gray-800 outline-none focus:border-[#C2477A] resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">GSTIN Number (Optional)</label>
                <input
                  type="text"
                  value={currentData?.gstin || ''}
                  onChange={e => handleChange('gstin', e.target.value.toUpperCase())}
                  placeholder="37AAAAA0000A1Z5"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs font-mono font-bold text-gray-800 outline-none focus:border-[#C2477A]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Store Currency Symbol</label>
                <input
                  type="text"
                  value={currentData?.currency || '₹'}
                  onChange={e => handleChange('currency', e.target.value)}
                  placeholder="₹"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs font-bold text-gray-800 outline-none focus:border-[#C2477A]"
                />
              </div>
            </div>
          </div>
        )}

        {/* 2. DELIVERY RATES TAB */}
        {activeTab === 'delivery' && (
          <div className="space-y-6 max-w-3xl">
            <div>
              <h2 className="text-base font-black text-gray-900">Delivery Rates & Fulfillment Rules</h2>
              <p className="text-xs text-gray-500 font-medium">
                Configure standard shipping rates, free shipping thresholds, and order size requirements.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200">
                <label className="block text-xs font-bold text-gray-800 mb-1">Standard Delivery Fee (₹)</label>
                <p className="text-[11px] text-gray-500 mb-2">Applied when order total is below free delivery threshold.</p>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 font-bold text-xs">₹</span>
                  <input
                    type="number"
                    min="0"
                    value={currentData?.delivery?.standardFee ?? 49}
                    onChange={e => handleNestedChange('delivery', 'standardFee', Number(e.target.value))}
                    className="w-full pl-8 pr-3.5 py-2.5 rounded-xl bg-white border border-gray-200 text-xs font-extrabold text-gray-900 outline-none focus:border-[#C2477A]"
                  />
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-pink-50/50 border border-pink-200/80">
                <label className="block text-xs font-bold text-pink-900 mb-1">Free Delivery Threshold (₹)</label>
                <p className="text-[11px] text-pink-700/80 mb-2">Orders equal to or above this amount receive 100% Free Shipping.</p>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#C2477A] font-bold text-xs">₹</span>
                  <input
                    type="number"
                    min="0"
                    value={currentData?.delivery?.freeDeliveryThreshold ?? 499}
                    onChange={e => handleNestedChange('delivery', 'freeDeliveryThreshold', Number(e.target.value))}
                    className="w-full pl-8 pr-3.5 py-2.5 rounded-xl bg-white border border-pink-200 text-xs font-extrabold text-gray-900 outline-none focus:border-[#C2477A]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Estimated Delivery Time Display</label>
                <input
                  type="text"
                  value={currentData?.delivery?.estimatedTimeText || ''}
                  onChange={e => handleNestedChange('delivery', 'estimatedTimeText', e.target.value)}
                  placeholder="e.g. Same Day / 24-48 Hours"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs font-bold text-gray-800 outline-none focus:border-[#C2477A]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Minimum Order Amount (₹)</label>
                <input
                  type="number"
                  min="0"
                  value={currentData?.delivery?.minOrderAmount ?? 0}
                  onChange={e => handleNestedChange('delivery', 'minOrderAmount', Number(e.target.value))}
                  placeholder="0 for no minimum"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs font-bold text-gray-800 outline-none focus:border-[#C2477A]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Max Items Per Order (Optional)</label>
                <input
                  type="number"
                  min="1"
                  value={currentData?.delivery?.maxItemsPerOrder ?? 50}
                  onChange={e => handleNestedChange('delivery', 'maxItemsPerOrder', Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs font-bold text-gray-800 outline-none focus:border-[#C2477A]"
                />
              </div>
            </div>
          </div>
        )}

        {/* 3. PAYMENTS & UPI GATEWAY TAB (2FA PROTECTED) */}
        {activeTab === 'payments' && !isPaymentSessionValid(currentAuthUser?.email) && (
          <div className="py-12 px-6 text-center max-w-md mx-auto space-y-4 animate-fade-in">
            <div className="w-16 h-16 rounded-3xl bg-purple-50 text-purple-700 border border-purple-200 mx-auto flex items-center justify-center shadow-sm">
              <Lock size={32} />
            </div>
            <div>
              <h2 className="text-base font-black text-gray-900">Payment & UPI Gateway Locked</h2>
              <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                Enterprise Two-Factor Authentication (2FA) is required to view or configure store UPI credentials, merchant QR codes, and payment options.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIs2FAGateOpen(true)}
              className="w-full py-3 bg-gradient-to-r from-purple-700 to-[#C2477A] text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <ShieldCheck size={16} />
              <span>Verify Password & Authenticator Code</span>
            </button>
          </div>
        )}

        {activeTab === 'payments' && isPaymentSessionValid(currentAuthUser?.email) && (
          <div className="space-y-6 max-w-3xl">
            <div>
              <h2 className="text-base font-black text-gray-900">Payment Modes & UPI Gateway</h2>
              <p className="text-xs text-gray-500 font-medium">
                Configure your store VPA UPI ID for customer transfers and delivery partner payment collection.
              </p>
            </div>

            {/* UPI Gateway & Live QR Code Management Card */}
            <div className="p-5 rounded-2xl bg-gradient-to-br from-purple-50/70 via-pink-50/40 to-white border border-purple-200/90 shadow-sm space-y-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-600 text-white flex items-center justify-center font-bold shadow-sm">
                  <QrCode size={20} />
                </div>
                <div>
                  <h3 className="text-sm font-black text-purple-950">Store UPI VPA Address & QR Code</h3>
                  <p className="text-[11px] text-purple-700/80 font-medium">
                    Displayed directly to delivery partners and customers for instant doorstep UPI payment collection.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
                {/* Left Column: Form inputs */}
                <div className="lg:col-span-7 space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-purple-950 mb-1">Official UPI ID (VPA) *</label>
                    <input
                      type="text"
                      value={currentData?.payments?.upiId || ''}
                      onChange={e => handleNestedChange('payments', 'upiId', e.target.value.trim())}
                      placeholder="e.g. salbeau.store@okaxis"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-purple-200 text-xs font-mono font-bold text-purple-900 outline-none focus:border-purple-600 shadow-2xs"
                    />
                    <span className="text-[10px] text-purple-700 font-medium mt-1 block">
                      Customers and delivery partner apps transfer funds to this VPA address.
                    </span>
                  </div>

                  {/* Upload Custom Merchant QR Standee / Image */}
                  <div className="p-4 rounded-xl bg-white/90 border border-purple-200/80 shadow-2xs space-y-3">
                    <ImageField
                      label="Store Merchant UPI QR Code"
                      sublabel="Upload official Bank / Google Pay / PhonePe / Paytm Merchant QR sticker or standee"
                      value={currentData?.payments?.upiQrCodeUrl || ''}
                      onChange={url => handleNestedChange('payments', 'upiQrCodeUrl', url)}
                      folder="payment-proofs"
                      filenamePrefix="store_merchant_upi_qr"
                      entityName={currentData?.storeName || 'Store UPI QR'}
                      aspectRatio="upi_qr"
                      localOnly={true}
                    />

                    {/* Direct Quick Device File Upload Shortcut */}
                    <div className="pt-2 border-t border-purple-100 flex flex-wrap items-center justify-between gap-2">
                      <div className="text-[11px] text-purple-900 font-bold flex items-center gap-1.5">
                        <Upload size={13} className="text-purple-600 shrink-0" />
                        <span>Direct Device Upload:</span>
                      </div>
                      <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-50 hover:bg-purple-100 border border-purple-200 text-purple-800 text-xs font-bold cursor-pointer transition-all shadow-2xs">
                        <Upload size={12} className={isUploadingQr ? 'animate-bounce' : ''} />
                        <span>{isUploadingQr ? 'Processing...' : 'Browse from Device'}</span>
                        <input
                          type="file"
                          accept="image/png,image/jpeg,image/webp"
                          className="hidden"
                          disabled={isUploadingQr}
                          onChange={handleDirectQrUpload}
                        />
                      </label>
                    </div>

                    <span className="text-[10px] text-gray-500 font-medium block leading-relaxed">
                      💡 <strong>Only local device upload is enabled.</strong> Select a high-res image from your device storage or drag & drop. If left empty, an automated dynamic UPI QR is generated on the fly.
                    </span>
                  </div>
                </div>

                {/* Right Column: Live Delivery Partner QR Code Card Preview */}
                <div className="lg:col-span-5 bg-white rounded-2xl p-4 border border-purple-200 shadow-xs flex flex-col items-center text-center">
                  <div className="flex items-center gap-1.5 mb-2.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                    <span className="text-[11px] font-black text-purple-900 uppercase tracking-wider">
                      Delivery Partner Live QR Preview
                    </span>
                  </div>

                  <div className="p-3 bg-purple-50/60 rounded-2xl border border-purple-100 mb-3 shadow-inner">
                    <img
                      src={
                        currentData?.payments?.upiQrCodeUrl ||
                        `https://api.qrserver.com/v1/create-qr-code/?size=260x260&data=${encodeURIComponent(
                          `upi://pay?pa=${currentData?.payments?.upiId || 'salbeau.store@okaxis'}&pn=${encodeURIComponent(
                            currentData?.storeName || 'Salbeau MakeUpStore'
                          )}&cu=INR`
                        )}`
                      }
                      alt="Store UPI QR Code Preview"
                      className="w-44 h-44 object-contain rounded-xl bg-white p-1"
                    />
                  </div>

                  <div className="space-y-1 w-full">
                    <div className="text-xs font-black text-gray-900">
                      {currentData?.storeName || 'Salbeau MakeUpStore'}
                    </div>
                    <div className="inline-block px-3 py-1 bg-purple-100 text-purple-900 rounded-full text-[11px] font-mono font-black">
                      {currentData?.payments?.upiId || 'salbeau.store@okaxis'}
                    </div>
                    <div className="text-[10px] text-emerald-700 font-bold pt-1 flex items-center justify-center gap-1">
                      <CheckCircle2 size={12} className="text-emerald-600" />
                      <span>{currentData?.payments?.upiQrCodeUrl ? 'Custom Merchant QR Active' : 'Dynamic UPI QR Active'}</span>
                    </div>
                    {currentData?.payments?.upiQrCodeUrl && (
                      <button
                        type="button"
                        onClick={() => handleNestedChange('payments', 'upiQrCodeUrl', '')}
                        className="text-[10px] text-rose-600 hover:text-rose-800 font-bold hover:underline cursor-pointer pt-0.5"
                      >
                        Remove Custom QR & Use Dynamic VPA
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Payment Mode Toggles */}
            <div className="space-y-3">
              <label className="flex items-center justify-between p-4 rounded-2xl border border-gray-200 bg-white hover:bg-gray-50 cursor-pointer">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center">
                    <QrCode size={18} />
                  </div>
                  <div>
                    <span className="text-xs font-black text-gray-900 block">Allow UPI & Online Payments</span>
                    <span className="text-[11px] text-gray-500 font-medium">
                      Enables customer UPI payments with delivery partner proof capture & admin verification.
                    </span>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={currentData?.payments?.acceptUpi !== false}
                  onChange={e => handleNestedChange('payments', 'acceptUpi', e.target.checked)}
                  className="w-5 h-5 accent-[#C2477A] cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between p-4 rounded-2xl border border-gray-200 bg-white hover:bg-gray-50 cursor-pointer">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                    <CreditCard size={18} />
                  </div>
                  <div>
                    <span className="text-xs font-black text-gray-900 block">Allow Cash on Delivery (COD)</span>
                    <span className="text-[11px] text-gray-500 font-medium">
                      Allows customers to pay in cash upon doorstep delivery.
                    </span>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={currentData?.payments?.acceptCod !== false}
                  onChange={e => handleNestedChange('payments', 'acceptCod', e.target.checked)}
                  className="w-5 h-5 accent-[#C2477A] cursor-pointer"
                />
              </label>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Max Cash on Delivery (COD) Limit (₹)</label>
                <p className="text-[11px] text-gray-500 mb-2">Orders exceeding this total cannot choose COD and must pay via UPI.</p>
                <div className="relative max-w-xs">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 font-bold text-xs">₹</span>
                  <input
                    type="number"
                    min="0"
                    value={currentData?.payments?.maxCodAmount ?? 5000}
                    onChange={e => handleNestedChange('payments', 'maxCodAmount', Number(e.target.value))}
                    className="w-full pl-8 pr-3.5 py-2.5 rounded-xl border border-gray-200 text-xs font-bold text-gray-800 outline-none focus:border-[#C2477A]"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 4. STORE STATUS & ANNOUNCEMENTS TAB */}
        {activeTab === 'broadcast' && (
          <div className="space-y-6 max-w-3xl">
            <div>
              <h2 className="text-base font-black text-gray-900">Store Live Operations & Broadcast Banners</h2>
              <p className="text-xs text-gray-500 font-medium">
                Instantly broadcast announcements or temporarily pause incoming customer orders.
              </p>
            </div>

            {/* Store Open / Closed Toggle */}
            <div className={`p-5 rounded-2xl border transition-all ${
              currentData?.storeOpen !== false ? 'bg-emerald-50/50 border-emerald-200' : 'bg-amber-50/60 border-amber-300'
            }`}>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-black text-gray-900">Accepting Customer Orders</h3>
                  <p className="text-[11px] text-gray-600 font-medium mt-0.5">
                    {currentData?.storeOpen !== false
                      ? 'Store is active. Customers can browse, add to cart, and checkout seamlessly.'
                      : 'Store is PAUSED. Customers see a maintenance notice and checkout is temporarily disabled.'}
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={currentData?.storeOpen !== false}
                  onChange={e => handleChange('storeOpen', e.target.checked)}
                  className="w-6 h-6 accent-emerald-600 cursor-pointer"
                />
              </div>
            </div>

            {/* Live Broadcast Announcement Banner */}
            <div className="p-5 rounded-2xl bg-gray-50 border border-gray-200 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-black text-gray-900">Broadcast Announcement Banner</h3>
                  <p className="text-[11px] text-gray-500 font-medium">
                    Displays an alert ribbon across the top of the mobile home screen.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={currentData?.announcement?.enabled === true}
                  onChange={e => handleNestedChange('announcement', 'enabled', e.target.checked)}
                  className="w-5 h-5 accent-[#C2477A] cursor-pointer"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Announcement Message Text</label>
                <textarea
                  rows={2}
                  value={currentData?.announcement?.message || ''}
                  onChange={e => handleNestedChange('announcement', 'message', e.target.value)}
                  placeholder="e.g. ✨ Grand Festive Sale! Flat 20% off on all luxury lipstick shades this week."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-gray-200 text-xs font-bold text-gray-800 outline-none focus:border-[#C2477A] resize-none"
                />
              </div>

              {/* Live Preview */}
              {currentData?.announcement?.enabled && currentData?.announcement?.message && (
                <div className="mt-3">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1.5">Customer App Preview:</span>
                  <div className="p-3 rounded-2xl bg-gradient-to-r from-[#CE4270] to-[#E25586] border border-pink-200 shadow-xs flex items-center gap-2.5 text-white">
                    <Sparkles size={16} className="shrink-0" />
                    <span className="text-xs font-bold tracking-tight">{currentData.announcement.message}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 6. SECURITY & 2FA TAB */}
        {activeTab === 'security_2fa' && (
          <Security2FASettingsPage
            currentAuthUser={currentAuthUser}
            onBackToSettings={() => setActiveTab('store_info')}
          />
        )}

        {/* 5. POLICIES & CANCELLATIONS TAB */}
        {activeTab === 'policies' && (
          <div className="space-y-6 max-w-3xl">
            <div>
              <h2 className="text-base font-black text-gray-900">Store Policies & Customer Rules</h2>
              <p className="text-xs text-gray-500 font-medium">
                Set customer self-cancellation grace periods, cancellation fees, and B2B verification policies.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200">
                <label className="block text-xs font-bold text-gray-800 mb-1">Cancellation Grace Window (Minutes)</label>
                <p className="text-[11px] text-gray-500 mb-2">Time window within which a customer can cancel their order free of charge.</p>
                <input
                  type="number"
                  min="0"
                  value={currentData?.policies?.graceWindowMinutes ?? 30}
                  onChange={e => handleNestedChange('policies', 'graceWindowMinutes', Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-gray-200 text-xs font-bold text-gray-800 outline-none focus:border-[#C2477A]"
                />
              </div>

              <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200">
                <label className="block text-xs font-bold text-gray-800 mb-1">Cancellation Fee Amount (₹)</label>
                <p className="text-[11px] text-gray-500 mb-2">Fee charged if cancellation happens after the grace window.</p>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 font-bold text-xs">₹</span>
                  <input
                    type="number"
                    min="0"
                    value={currentData?.policies?.cancelFeeAmount ?? 0}
                    onChange={e => handleNestedChange('policies', 'cancelFeeAmount', Number(e.target.value))}
                    className="w-full pl-8 pr-3.5 py-2.5 rounded-xl bg-white border border-gray-200 text-xs font-bold text-gray-800 outline-none focus:border-[#C2477A]"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <label className="flex items-center justify-between p-4 rounded-2xl border border-gray-200 bg-white hover:bg-gray-50 cursor-pointer">
                <div>
                  <span className="text-xs font-black text-gray-900 block">Allow Customer Self-Cancellation</span>
                  <span className="text-[11px] text-gray-500 font-medium">
                    When enabled, customers can cancel their pending orders directly from their Order Details screen.
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={currentData?.policies?.allowSelfCancel !== false}
                  onChange={e => handleNestedChange('policies', 'allowSelfCancel', e.target.checked)}
                  className="w-5 h-5 accent-[#C2477A] cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between p-4 rounded-2xl border border-gray-200 bg-white hover:bg-gray-50 cursor-pointer">
                <div>
                  <span className="text-xs font-black text-gray-900 block">Require Strict B2B Verification</span>
                  <span className="text-[11px] text-gray-500 font-medium">
                    Salon and professional accounts must submit business license / certificate before accessing wholesale discounts.
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={currentData?.policies?.requireB2BVerification !== false}
                  onChange={e => handleNestedChange('policies', 'requireB2BVerification', e.target.checked)}
                  className="w-5 h-5 accent-[#C2477A] cursor-pointer"
                />
              </label>
            </div>
          </div>
        )}
      </div>

      {/* ── TWO-FACTOR AUTHENTICATION SECURITY GATE MODAL ── */}
      <PaymentSecurityGateModal
        isOpen={is2FAGateOpen}
        onClose={() => setIs2FAGateOpen(false)}
        currentAuthUser={currentAuthUser}
        onSuccess={() => {
          setIs2FAGateOpen(false);
          setActiveTab('payments');
        }}
        onNavigateToSetup2FA={() => {
          setIs2FAGateOpen(false);
          setActiveTab('security_2fa');
        }}
        targetSectionName="Payment Modes & UPI Gateway"
      />
    </div>
  );
}
