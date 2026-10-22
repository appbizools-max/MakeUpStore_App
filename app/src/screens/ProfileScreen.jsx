import React, { useState, useRef } from 'react';
import { useApp } from '../context/AppContext.jsx';
import { lookupIndianPincode, validateIndianPincode } from '../utils/pincodeService';
import { isB2BRole, isUserB2BVerified, ROLE_SHORT_TITLES } from '../utils/b2bVerificationService';
import {
  User,
  ShieldCheck,
  ShieldAlert,
  MapPin,
  Edit2,
  LogOut,
  HelpCircle,
  Plus,
  Trash2,
  CheckCircle,
  Phone,
  MessageCircle,
  Mail,
  X,
  Sparkles,
  ShoppingBag,
  Heart,
  ChevronRight,
  CreditCard,
  Loader2
} from 'lucide-react';

// Cohesive Salbeau Brand Colors - Clean White Background (No Pink Canvas)
const PALETTE = {
  bgPrimary: '#FFFFFF',       // Clean pure white canvas (No pink)
  cardBg: '#FFFFFF',          // Clean white card
  cardSurface: '#FFFFFF',     // Clean white surface
  cardInner: '#F9FAFB',       // Subtle neutral chip
  logoPink: '#C2477A',        // Salbeau Logo Signature Rose Magenta for icons, primary actions & badges
  logoPinkDark: '#9E2D5B',    // Deep Plum Rose for active/pressed
  logoPinkLight: '#FDF2F8',   // Very soft subtle tag tint
  borderLight: '#F0E6EC',     // Ultra-light delicate border
  borderAccent: '#E2D1DC',    // Refined subtle accent border
  borderNeutral: '#E5E7EB',   // Clean neutral border
  textDark: '#1E1B1D',        // High-contrast deep noir text (WCAG AAA)
  textMuted: '#6B5E65',       // Secondary slate text (WCAG AA)
  textSubtle: '#8C7E86',      // Caption slate
  white: '#FFFFFF',
};

export const ProfileScreen = () => {
  const {
    userProfile,
    setUserProfile,
    userRole,
    setUserRole,
    orders = [],
    addresses = [],
    favorites = [],
    addAddress,
    updateAddress,
    deleteAddress,
    setDefaultAddress,
    setCurrentScreen,
    logout
  } = useApp();

  const [isEditing, setIsEditing] = useState(false);
  const [profileForm, setProfileForm] = useState({ ...userProfile });
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState(null);

  // Address Form States - Starts EMPTY (No mock data!)
  const [addrForm, setAddrForm] = useState({
    label: 'Home',
    name: '',
    phone: '',
    houseNo: '',
    streetArea: '',
    landmark: '',
    city: '',
    state: '',
    pincode: '',
    isDefault: false
  });

  // Real Pincode Lookup States
  const [pincodeLoading, setPincodeLoading] = useState(false);
  const [pincodeStatus, setPincodeStatus] = useState(null); // 'searching' | 'found' | 'error' | null
  const [pincodeMessage, setPincodeMessage] = useState('');
  const lastLookedUpPincodeRef = useRef('');
  const pincodeDebounceRef = useRef(null);

  const [showSupportModal, setShowSupportModal] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const isPendingVerification = userRole !== 'general' && userProfile.verificationStatus === 'pending';

  const roleTitles = {
    general: 'Retail Customer Account',
    salon: 'Salon Owner Partner',
    artist: 'Makeup Artist Partner',
    beautician: 'Beautician Partner'
  };

  const initialLetter = userProfile?.name && userProfile.name.trim().length > 0
    ? userProfile.name.trim().charAt(0).toUpperCase()
    : 'S';

  const handleSaveProfile = (e) => {
    e.preventDefault();
    setUserProfile(profileForm);
    setIsEditing(false);
  };

  // 1. New Address: Form must start EMPTY
  const openNewAddressModal = () => {
    setEditingAddressId(null);
    setAddrForm({
      label: 'Home',
      name: '',
      phone: '',
      houseNo: '',
      streetArea: '',
      landmark: '',
      city: '',
      state: '',
      pincode: '',
      isDefault: addresses.length === 0
    });
    setPincodeLoading(false);
    setPincodeStatus(null);
    setPincodeMessage('');
    lastLookedUpPincodeRef.current = '';
    if (pincodeDebounceRef.current) clearTimeout(pincodeDebounceRef.current);
    setShowAddressModal(true);
  };

  // 11. Existing Address: Load saved values, do NOT trigger automatic pincode lookup on mount
  const openEditAddressModal = (addr) => {
    setEditingAddressId(addr.id);
    const cleanPin = String(addr.pincode || '').replace(/\D/g, '').slice(0, 6);
    setAddrForm({
      label: addr.label || 'Home',
      name: addr.name || '',
      phone: addr.phone || '',
      houseNo: addr.houseNo || '',
      streetArea: addr.streetArea || '',
      landmark: addr.landmark || '',
      city: addr.city || '',
      state: addr.state || '',
      pincode: cleanPin,
      isDefault: !!addr.isDefault
    });
    lastLookedUpPincodeRef.current = cleanPin;
    setPincodeLoading(false);
    setPincodeStatus(null);
    setPincodeMessage('');
    if (pincodeDebounceRef.current) clearTimeout(pincodeDebounceRef.current);
    setShowAddressModal(true);
  };

  // 2, 5, 6, 8, 9: Real Pincode Lookup
  const handlePincodeChange = (val) => {
    const cleanPin = String(val || '').replace(/\D/g, '').slice(0, 6);
    setAddrForm(prev => ({ ...prev, pincode: cleanPin }));

    if (cleanPin.length < 6) {
      if (pincodeStatus) {
        setPincodeStatus(null);
        setPincodeMessage('');
      }
      if (pincodeDebounceRef.current) {
        clearTimeout(pincodeDebounceRef.current);
      }
      return;
    }

    if (cleanPin === lastLookedUpPincodeRef.current) {
      return;
    }

    if (pincodeDebounceRef.current) {
      clearTimeout(pincodeDebounceRef.current);
    }

    setPincodeLoading(true);
    setPincodeStatus('searching');
    setPincodeMessage('Searching...');

    pincodeDebounceRef.current = setTimeout(async () => {
      try {
        const res = await lookupIndianPincode(cleanPin);
        lastLookedUpPincodeRef.current = cleanPin;
        setPincodeLoading(false);

        if (res.success) {
          setPincodeStatus('found');
          setPincodeMessage('✓ Address found');
          setAddrForm(prev => ({
            ...prev,
            city: res.city || prev.city,
            state: res.state || prev.state,
            streetArea: (res.locality && !prev.streetArea) ? res.locality : prev.streetArea
          }));
        } else {
          setPincodeStatus('error');
          setPincodeMessage("We couldn't find this pincode. Please check it or enter the address manually.");
        }
      } catch (err) {
        setPincodeLoading(false);
        setPincodeStatus('error');
        setPincodeMessage("We couldn't find this pincode. Please check it or enter the address manually.");
      }
    }, 300);
  };

  // 10. Address Save: Contains the exact manually edited values
  const handleAddressFormSubmit = (e) => {
    e.preventDefault();
    if (!addrForm.name.trim()) {
      alert('Please enter recipient full name.');
      return;
    }
    if (!addrForm.phone.trim() || addrForm.phone.trim().replace(/\D/g, '').length < 10) {
      alert('Please enter a valid 10-digit mobile number.');
      return;
    }
    if (!addrForm.pincode.trim() || addrForm.pincode.trim().length !== 6) {
      alert('Please enter a valid 6-digit PIN code.');
      return;
    }
    if (!addrForm.city.trim()) {
      alert('Please enter city / district.');
      return;
    }
    if (!addrForm.state.trim()) {
      alert('Please enter state.');
      return;
    }
    if (!addrForm.houseNo.trim()) {
      alert('Please enter flat/house number and building name.');
      return;
    }
    if (!addrForm.streetArea.trim()) {
      alert('Please enter street address or locality.');
      return;
    }

    const parts = [
      addrForm.houseNo.trim(),
      addrForm.streetArea.trim(),
      addrForm.landmark.trim() ? `Near ${addrForm.landmark.trim()}` : '',
      addrForm.city.trim(),
      `${addrForm.state.trim()} - ${addrForm.pincode.trim()}`
    ].filter(Boolean);

    const fullText = parts.join(', ');

    const payload = {
      label: addrForm.label,
      name: addrForm.name.trim(),
      phone: addrForm.phone.trim(),
      houseNo: addrForm.houseNo.trim(),
      streetArea: addrForm.streetArea.trim(),
      landmark: addrForm.landmark.trim(),
      city: addrForm.city.trim(),
      state: addrForm.state.trim(),
      pincode: addrForm.pincode.trim(),
      text: fullText,
      isDefault: addrForm.isDefault
    };

    if (editingAddressId) {
      if (updateAddress) {
        updateAddress(editingAddressId, payload);
      }
    } else {
      addAddress(payload);
    }

    setShowAddressModal(false);
  };

  return (
    <div className="pb-28 min-h-screen bg-white select-none animate-fade-in">
      {/* Top Sticky Header */}
      <div className="sticky top-0 z-20 bg-white/95 backdrop-blur-md px-4 py-3.5 border-b border-[#F0E6EC] flex items-center justify-between shadow-2xs">
        <div>
          <h1 className="text-sm font-black text-[#1E1B1D] uppercase tracking-wider">
            Account Profile
          </h1>
          <p className="text-[10px] font-semibold text-[#6B5E65]">
            Salbeau Luxury Beauty Platform
          </p>
        </div>

        <button
          onClick={() => setShowSupportModal(true)}
          className="text-[#C2477A] bg-white border border-[#E5E7EB] hover:bg-gray-50 px-3 py-1.5 rounded-full font-bold text-xs flex items-center gap-1.5 transition-colors shadow-2xs"
        >
          <HelpCircle size={14} /> Helpdesk
        </button>
      </div>

      <div className="p-4 space-y-4 text-xs max-w-md mx-auto">
        {/* User Identity Hero Card */}
        <div className="p-5 bg-white rounded-3xl border border-[#F0E6EC] shadow-xs flex items-center gap-4 relative overflow-hidden">
          {/* Monogram Avatar with Double Ring */}
          <div className="relative shrink-0">
            <div className="w-16 h-16 rounded-full bg-[#C2477A] text-white flex items-center justify-center font-black text-2xl shadow-md border-2 border-white ring-2 ring-[#F0E6EC]">
              {initialLetter}
            </div>
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="absolute -bottom-1 -right-1 w-6 h-6 bg-white border border-[#E2D1DC] rounded-full flex items-center justify-center text-[#C2477A] shadow-xs hover:bg-gray-50"
              title="Edit Profile"
            >
              <Edit2 size={11} />
            </button>
          </div>

          <div className="flex-1 min-w-0 z-10">
            <h2 className="text-base font-black text-[#1E1B1D] truncate">
              {userProfile.name}
            </h2>

            <div className="inline-flex items-center gap-1 mt-1 bg-[#FDF2F8] border border-[#E2D1DC] px-2.5 py-0.5 rounded-full">
              <Sparkles size={10} className="text-[#C2477A]" />
              <span className="text-[10px] font-black text-[#C2477A] uppercase tracking-wider">
                {roleTitles[userRole] || 'Retail Customer'}
              </span>
            </div>

            <span className="text-[11px] font-semibold text-[#6B5E65] block mt-1">
              {userProfile.phone}
            </span>
          </div>
        </div>

        {/* Quick Highlights Strip: Orders, Addresses, Wishlist */}
        <div className="grid grid-cols-3 gap-2.5">
          <div
            onClick={() => setCurrentScreen('orders')}
            className="p-3 bg-white rounded-2xl border border-[#F0E6EC] shadow-2xs text-center cursor-pointer hover:bg-gray-50 transition-colors"
          >
            <div className="w-9 h-9 mx-auto rounded-full bg-[#F9FAFB] border border-[#F0E6EC] flex items-center justify-center text-[#C2477A] mb-1.5">
              <ShoppingBag size={17} />
            </div>
            <span className="text-base font-black text-[#1E1B1D] block">{orders.length}</span>
            <span className="text-[10px] font-bold text-[#6B5E65] uppercase tracking-wider">Orders</span>
          </div>

          <div
            onClick={() => setShowAddressModal(true)}
            className="p-3 bg-white rounded-2xl border border-[#F0E6EC] shadow-2xs text-center cursor-pointer hover:bg-gray-50 transition-colors"
          >
            <div className="w-9 h-9 mx-auto rounded-full bg-[#F9FAFB] border border-[#F0E6EC] flex items-center justify-center text-[#C2477A] mb-1.5">
              <MapPin size={17} />
            </div>
            <span className="text-base font-black text-[#1E1B1D] block">{addresses.length || 1}</span>
            <span className="text-[10px] font-bold text-[#6B5E65] uppercase tracking-wider">Addresses</span>
          </div>

          <div
            onClick={() => setCurrentScreen('wishlist')}
            className="p-3 bg-white rounded-2xl border border-[#F0E6EC] shadow-2xs text-center cursor-pointer hover:bg-gray-50 transition-colors"
          >
            <div className="w-9 h-9 mx-auto rounded-full bg-[#F9FAFB] border border-[#F0E6EC] flex items-center justify-center text-[#C2477A] mb-1.5">
              <Heart size={17} className={favorites.length > 0 ? "fill-[#C2477A]" : ""} />
            </div>
            <span className="text-base font-black text-[#1E1B1D] block">{favorites.length}</span>
            <span className="text-[10px] font-bold text-[#6B5E65] uppercase tracking-wider">Wishlist</span>
          </div>
        </div>        {/* Verification Status Card (for Professional Accounts) */}
        {isB2BRole(userRole || userProfile?.role) && (() => {
          const vStatus = (userProfile?.verificationStatus || 'not_submitted').toLowerCase();
          const isVerified = isUserB2BVerified(userProfile);
          const roleLabel = ROLE_SHORT_TITLES[userRole || userProfile?.role] || 'Professional';

          let bg = 'bg-[#FFF5F8] border-[#F8BBD0] text-[#3A2430]';
          let icon = <ShieldAlert size={20} className="text-[#C2477A]" />;
          let title = 'Verify Professional Account';
          let subtitle = 'Submit credentials to activate wholesale pricing & bulk tiers';
          let btnText = 'Verify Now';
          let target = 'b2b_verification';

          if (isVerified) {
            bg = 'bg-emerald-50 border-emerald-200 text-emerald-950';
            icon = <ShieldCheck size={20} className="text-emerald-600" />;
            title = `Verified ${roleLabel} Account`;
            subtitle = 'B2B Wholesale Pricing & Quantity Tiers Active';
            btnText = 'View Status';
            target = 'verification_status';
          } else if (vStatus === 'submitted' || vStatus === 'under_review') {
            bg = 'bg-blue-50 border-blue-200 text-blue-950';
            icon = <ShieldAlert size={20} className="text-blue-600" />;
            title = 'Verification Under Review';
            subtitle = 'Salbeau Admin team is verifying your application';
            btnText = 'Check Status';
            target = 'verification_status';
          } else if (vStatus === 'resubmission_required' || vStatus === 'rejected') {
            bg = 'bg-amber-50 border-amber-300 text-amber-950';
            icon = <ShieldAlert size={20} className="text-amber-600" />;
            title = 'Action Required';
            subtitle = userProfile?.rejectionReason ? `"${userProfile.rejectionReason}"` : 'Admin requested updates on your verification details';
            btnText = 'Update & Resubmit';
            target = 'b2b_verification';
          } else if (vStatus === 'suspended') {
            bg = 'bg-rose-50 border-rose-300 text-rose-950';
            icon = <ShieldAlert size={20} className="text-rose-600" />;
            title = 'Account Suspended';
            subtitle = 'B2B pricing access suspended by administrator';
            btnText = 'View Details';
            target = 'verification_status';
          }

          return (
            <div className={`p-4 rounded-2xl border transition-all shadow-xs flex items-center justify-between gap-3 ${bg}`}>
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shrink-0 shadow-2xs">
                  {icon}
                </div>
                <div className="min-w-0">
                  <h3 className="font-black text-xs truncate">{title}</h3>
                  <p className="text-[10px] opacity-80 truncate mt-0.5">{subtitle}</p>
                </div>
              </div>

              <button
                onClick={() => setCurrentScreen(target)}
                className="shrink-0 px-3.5 py-1.5 rounded-full bg-white text-xs font-black border border-stone-200 shadow-2xs hover:bg-stone-50 cursor-pointer transition-colors"
              >
                {btnText}
              </button>
            </div>
          );
        })()}   )}

        {/* Personal & Business Info Section */}
        <div className="p-4 bg-white rounded-3xl border border-[#F0E6EC] shadow-xs space-y-3">
          <div className="flex items-center justify-between pb-1 border-b border-gray-100">
            <h3 className="font-black text-[#1E1B1D] uppercase tracking-wider text-[11px]">
              Personal Information
            </h3>
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="text-[#C2477A] bg-white border border-[#E5E7EB] px-2.5 py-1 rounded-full font-bold text-[11px] flex items-center gap-1 hover:bg-gray-50"
            >
              <Edit2 size={12} /> {isEditing ? 'Cancel' : 'Edit Profile'}
            </button>
          </div>

          {isEditing ? (
            <form onSubmit={handleSaveProfile} className="space-y-3 pt-1">
              <div>
                <label className="block text-[#6B5E65] font-bold text-[10px] uppercase mb-1">Full Name</label>
                <input
                  type="text"
                  value={profileForm.name}
                  onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-[#E5E7EB] focus:border-[#C2477A] bg-white outline-none text-xs text-[#1E1B1D] font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[#6B5E65] font-bold text-[10px] uppercase mb-1">Phone Number</label>
                  <input
                    type="text"
                    value={profileForm.phone}
                    onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-[#E5E7EB] focus:border-[#C2477A] bg-white outline-none text-xs text-[#1E1B1D] font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[#6B5E65] font-bold text-[10px] uppercase mb-1">Email Address</label>
                  <input
                    type="email"
                    value={profileForm.email}
                    onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-[#E5E7EB] focus:border-[#C2477A] bg-white outline-none text-xs text-[#1E1B1D] font-bold"
                  />
                </div>
              </div>

              {userRole !== 'general' && (
                <div className="grid grid-cols-2 gap-2 pt-1 border-t border-gray-100">
                  <div>
                    <label className="block text-[#6B5E65] font-bold text-[10px] uppercase mb-1">Business Name</label>
                    <input
                      type="text"
                      value={profileForm.businessName}
                      onChange={(e) => setProfileForm({ ...profileForm, businessName: e.target.value })}
                      className="w-full p-2.5 rounded-xl border border-[#E5E7EB] focus:border-[#C2477A] bg-white outline-none text-xs text-[#1E1B1D] font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-[#6B5E65] font-bold text-[10px] uppercase mb-1">GST / Cert ID</label>
                    <input
                      type="text"
                      value={profileForm.gstNo}
                      onChange={(e) => setProfileForm({ ...profileForm, gstNo: e.target.value })}
                      className="w-full p-2.5 rounded-xl border border-[#E5E7EB] focus:border-[#C2477A] bg-white outline-none text-xs text-[#1E1B1D] font-bold"
                    />
                  </div>
                </div>
              )}

              <button
                type="submit"
                className="w-full py-3 bg-[#C2477A] hover:bg-[#9E2D5B] text-white font-bold text-xs rounded-xl shadow-md transition-colors"
              >
                Save Profile Changes
              </button>
            </form>
          ) : (
            <div className="space-y-2.5 text-[#1E1B1D]">
              <div className="flex justify-between py-1 border-b border-gray-100">
                <span className="text-[#6B5E65] font-medium">Full Name:</span>
                <span className="font-bold text-[#1E1B1D]">{userProfile.name}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-gray-100">
                <span className="text-[#6B5E65] font-medium">Phone Number:</span>
                <span className="font-bold text-[#1E1B1D]">{userProfile.phone}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-gray-100">
                <span className="text-[#6B5E65] font-medium">Email:</span>
                <span className="font-bold text-[#1E1B1D]">{userProfile.email}</span>
              </div>
              {userRole !== 'general' && (
                <>
                  <div className="flex justify-between py-1 border-b border-gray-100">
                    <span className="text-[#6B5E65] font-medium">Business Name:</span>
                    <span className="font-bold text-[#C2477A]">{userProfile.businessName || 'Not configured'}</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-[#6B5E65] font-medium">GST / Reg No:</span>
                    <span className="font-bold text-[#1E1B1D]">{userProfile.gstNo || 'Not added'}</span>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* Address Book Section */}
        <div className="p-4 bg-white rounded-3xl border border-[#F0E6EC] shadow-xs space-y-3">
          <div className="flex items-center justify-between pb-1 border-b border-gray-100">
            <h3 className="font-black text-[#1E1B1D] uppercase tracking-wider text-[11px] flex items-center gap-1.5">
              <MapPin size={15} className="text-[#C2477A]" /> Saved Address Book ({addresses.length})
            </h3>
            <button
              onClick={openNewAddressModal}
              className="text-[#C2477A] bg-white border border-[#E5E7EB] px-2.5 py-1 rounded-full font-bold text-[11px] flex items-center gap-1 hover:bg-gray-50"
            >
              <Plus size={13} /> Add New
            </button>
          </div>

          <div className="space-y-2">
            {addresses.map((addr) => (
              <div key={addr.id} className="p-3 bg-white rounded-2xl border border-[#E5E7EB] space-y-1.5">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <span className="font-black text-[#1E1B1D] text-xs">{addr.label}</span>
                    {addr.isDefault ? (
                      <span className="text-[9px] bg-[#C2477A] text-white px-2 py-0.5 rounded-full font-bold">Default</span>
                    ) : (
                      <button
                        onClick={() => setDefaultAddress(addr.id)}
                        className="text-[9px] text-[#C2477A] hover:underline font-bold"
                      >
                        Set Default
                      </button>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openEditAddressModal(addr)}
                      className="text-[#8C7E86] hover:text-[#C2477A] p-1 transition-colors"
                      title="Edit address"
                    >
                      <Edit2 size={13} />
                    </button>
                    <button
                      onClick={() => deleteAddress(addr.id)}
                      className="text-[#8C7E86] hover:text-[#C2477A] p-1 transition-colors"
                      title="Delete address"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
                {(addr.name || addr.phone) && (
                  <p className="text-[10px] text-gray-500 font-bold">{addr.name} {addr.phone ? `• ${addr.phone}` : ''}</p>
                )}
                <p className="text-[11px] text-[#6B5E65] font-medium leading-snug">{addr.text}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Clean Logout Action */}
        <button
          onClick={() => setShowLogoutModal(true)}
          className="w-full py-3.5 bg-white hover:bg-gray-50 text-[#C2477A] font-black text-xs rounded-2xl border border-[#E2D1DC] flex items-center justify-center gap-2 cursor-pointer shadow-2xs transition-colors"
        >
          <LogOut size={16} /> LOG OUT SALBEAU ACCOUNT
        </button>

        {/* Footer Brand Mark */}
        <div className="text-center pt-2 pb-4">
          <p className="text-[11px] font-semibold text-[#8C7E86]">
            Salbeau Luxury Beauty Platform • v2.4.1
          </p>
          <p className="text-[10px] text-[#8C7E86]/80 mt-0.5">
            Crafted for Salon Owners, Artists & Beauty Lovers
          </p>
        </div>
      </div>

      {/* Add / Edit Address Modal */}
      {showAddressModal && (
        <div className="fixed inset-0 bg-black/45 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fade-in overflow-y-auto">
          <div className="bg-white rounded-3xl border border-[#F0E6EC] shadow-2xl w-full max-w-md p-6 relative overflow-hidden text-xs my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-gray-100">
              <div>
                <h3 className="font-black text-sm text-[#1E1B1D]">
                  {editingAddressId ? 'Edit Delivery Address' : 'Add Delivery Address'}
                </h3>
                <p className="text-[10px] text-[#6B5E65]">
                  {editingAddressId ? 'Update location and recipient details' : 'Enter recipient and location details'}
                </p>
              </div>
              <button
                onClick={() => setShowAddressModal(false)}
                className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-[#6B5E65] hover:text-[#1E1B1D]"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleAddressFormSubmit} className="space-y-4">
              {/* Address Tag Selector */}
              <div>
                <label className="block text-[#6B5E65] font-bold text-[10px] uppercase mb-1.5">Save Address As</label>
                <div className="flex gap-2">
                  {['Home', 'Office', 'Other'].map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => setAddrForm(prev => ({ ...prev, label: tag }))}
                      className={`flex-1 py-2 px-3 rounded-xl border font-bold text-xs transition-colors ${
                        addrForm.label === tag
                          ? 'bg-[#C2477A] border-[#C2477A] text-white shadow-xs'
                          : 'bg-white border-[#E5E7EB] text-[#1E1B1D] hover:bg-gray-50'
                      }`}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>

              {/* Recipient Details */}
              <div className="space-y-3 pt-1">
                <div>
                  <label className="block text-[#6B5E65] font-bold text-[10px] uppercase mb-1.5">Recipient Full Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="Recipient Full Name"
                    value={addrForm.name}
                    onChange={(e) => setAddrForm(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full p-2.5 rounded-xl border border-[#E5E7EB] focus:border-[#C2477A] bg-white text-xs text-[#1E1B1D] font-bold outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[#6B5E65] font-bold text-[10px] uppercase mb-1.5">Phone Number *</label>
                  <input
                    type="tel"
                    required
                    placeholder="+91 10-digit mobile number"
                    value={addrForm.phone}
                    onChange={(e) => setAddrForm(prev => ({ ...prev, phone: e.target.value }))}
                    className="w-full p-2.5 rounded-xl border border-[#E5E7EB] focus:border-[#C2477A] bg-white text-xs text-[#1E1B1D] font-bold outline-none"
                  />
                </div>
              </div>

              {/* Location Details with Real Pincode Trigger */}
              <div className="space-y-3 pt-2 border-t border-gray-100">
                {/* 1. PINCODE * */}
                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="block text-[#6B5E65] font-bold text-[10px] uppercase">Pincode *</label>
                    {pincodeLoading && (
                      <span className="flex items-center gap-1 text-[#C2477A] font-bold text-[10px]">
                        <Loader2 size={12} className="animate-spin" /> Searching...
                      </span>
                    )}
                    {!pincodeLoading && pincodeStatus === 'found' && (
                      <span className="text-[#16A34A] font-bold text-[10px] flex items-center gap-1">
                        ✓ Address found
                      </span>
                    )}
                  </div>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    placeholder="Enter 6-digit Pincode"
                    value={addrForm.pincode}
                    onChange={(e) => handlePincodeChange(e.target.value)}
                    className={`w-full p-2.5 rounded-xl border bg-white text-xs text-[#1E1B1D] font-bold outline-none ${
                      pincodeStatus === 'error'
                        ? 'border-red-500'
                        : pincodeStatus === 'found'
                        ? 'border-green-500'
                        : 'border-[#E5E7EB] focus:border-[#C2477A]'
                    }`}
                  />
                  {pincodeStatus === 'error' && (
                    <p className="text-red-500 text-[10px] font-semibold mt-1">
                      {pincodeMessage || "We couldn't find this pincode. Please check it or enter the address manually."}
                    </p>
                  )}
                </div>

                {/* 2. City & State (Editable) */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[#6B5E65] font-bold text-[10px] uppercase mb-1.5">City / District *</label>
                    <input
                      type="text"
                      required
                      placeholder="City / District"
                      value={addrForm.city}
                      onChange={(e) => setAddrForm(prev => ({ ...prev, city: e.target.value }))}
                      className="w-full p-2.5 rounded-xl border border-[#E5E7EB] focus:border-[#C2477A] bg-white text-xs text-[#1E1B1D] font-bold outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[#6B5E65] font-bold text-[10px] uppercase mb-1.5">State *</label>
                    <input
                      type="text"
                      required
                      placeholder="State"
                      value={addrForm.state}
                      onChange={(e) => setAddrForm(prev => ({ ...prev, state: e.target.value }))}
                      className="w-full p-2.5 rounded-xl border border-[#E5E7EB] focus:border-[#C2477A] bg-white text-xs text-[#1E1B1D] font-bold outline-none"
                    />
                  </div>
                </div>

                {/* 3. Street / Area (Editable) */}
                <div>
                  <label className="block text-[#6B5E65] font-bold text-[10px] uppercase mb-1.5">Street / Area *</label>
                  <input
                    type="text"
                    required
                    placeholder="Street, Locality, Sector"
                    value={addrForm.streetArea}
                    onChange={(e) => setAddrForm(prev => ({ ...prev, streetArea: e.target.value }))}
                    className="w-full p-2.5 rounded-xl border border-[#E5E7EB] focus:border-[#C2477A] bg-white text-xs text-[#1E1B1D] font-bold outline-none"
                  />
                </div>

                {/* 4. Flat / House No. (User manual, never overwritten) */}
                <div>
                  <label className="block text-[#6B5E65] font-bold text-[10px] uppercase mb-1.5">Flat / House No. *</label>
                  <input
                    type="text"
                    required
                    placeholder="Flat, House No., Building Name"
                    value={addrForm.houseNo}
                    onChange={(e) => setAddrForm(prev => ({ ...prev, houseNo: e.target.value }))}
                    className="w-full p-2.5 rounded-xl border border-[#E5E7EB] focus:border-[#C2477A] bg-white text-xs text-[#1E1B1D] font-bold outline-none"
                  />
                </div>

                {/* 5. Landmark (Optional, never overwritten) */}
                <div>
                  <label className="block text-[#6B5E65] font-bold text-[10px] uppercase mb-1.5">Landmark (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. Near Metro Station"
                    value={addrForm.landmark}
                    onChange={(e) => setAddrForm(prev => ({ ...prev, landmark: e.target.value }))}
                    className="w-full p-2.5 rounded-xl border border-[#E5E7EB] focus:border-[#C2477A] bg-white text-xs text-[#1E1B1D] font-bold outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="chkDefault"
                  checked={addrForm.isDefault}
                  onChange={(e) => setAddrForm(prev => ({ ...prev, isDefault: e.target.checked }))}
                  className="accent-[#C2477A]"
                />
                <label htmlFor="chkDefault" className="text-xs font-semibold text-[#1E1B1D]">
                  Set as default shipping address
                </label>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddressModal(false)}
                  className="w-1/2 bg-white border border-[#E5E7EB] text-[#6B5E65] py-3 rounded-xl font-bold hover:bg-gray-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="w-1/2 bg-[#C2477A] hover:bg-[#9E2D5B] text-white py-3 rounded-xl font-bold shadow-md transition-colors cursor-pointer"
                >
                  {editingAddressId ? 'Update Address' : 'Save Address'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Support Modal */}
      {showSupportModal && (
        <div className="fixed inset-0 bg-black/45 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl border border-[#F0E6EC] shadow-2xl w-full max-w-sm p-6 relative overflow-hidden text-xs text-center">
            <div className="w-12 h-12 rounded-2xl bg-white border border-[#E5E7EB] text-[#C2477A] flex items-center justify-center font-bold mx-auto mb-3 shadow-xs">
              <HelpCircle size={24} />
            </div>

            <h3 className="font-black text-base text-[#1E1B1D]">Salbeau Concierge</h3>
            <p className="text-xs text-[#6B5E65] mt-1 mb-5">
              Need assistance with your account, pricing tier, or orders?
            </p>

            <div className="space-y-2.5 text-left">
              <a
                href="tel:+918007252328"
                className="p-3 bg-white hover:bg-gray-50 rounded-2xl border border-[#E5E7EB] flex items-center gap-3 font-bold text-[#1E1B1D] transition-colors"
              >
                <div className="w-9 h-9 rounded-xl bg-gray-50 flex items-center justify-center text-[#C2477A]">
                  <Phone size={18} />
                </div>
                <div>
                  <span className="block text-xs font-black">Call Customer Desk</span>
                  <span className="text-[10px] text-[#6B5E65] font-normal">+91 800 725 2328 (Toll Free)</span>
                </div>
              </a>

              <a
                href="https://wa.me/919876543210"
                target="_blank"
                rel="noreferrer"
                className="p-3 bg-white hover:bg-gray-50 rounded-2xl border border-[#E5E7EB] flex items-center gap-3 font-bold text-[#1E1B1D] transition-colors"
              >
                <div className="w-9 h-9 rounded-xl bg-gray-50 flex items-center justify-center text-[#C2477A]">
                  <MessageCircle size={18} />
                </div>
                <div>
                  <span className="block text-xs font-black">WhatsApp Helpdesk</span>
                  <span className="text-[10px] text-[#6B5E65] font-normal">+91 98765 43210</span>
                </div>
              </a>
            </div>

            <button
              onClick={() => setShowSupportModal(false)}
              className="w-full mt-5 bg-white border border-[#E5E7EB] text-[#C2477A] py-3 rounded-xl font-black uppercase tracking-wider hover:bg-gray-50 transition-colors"
            >
              Close Helpdesk
            </button>
          </div>
        </div>
      )}

      {/* Logout Confirmation Modal */}
      {showLogoutModal && (
        <div className="fixed inset-0 bg-black/45 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl border border-[#F0E6EC] shadow-2xl w-full max-w-sm p-6 relative overflow-hidden text-center text-xs">
            <div className="w-12 h-12 rounded-2xl bg-white text-[#C2477A] border border-[#E5E7EB] flex items-center justify-center font-bold mx-auto mb-3 shadow-xs">
              <LogOut size={24} />
            </div>

            <h3 className="font-black text-base text-[#1E1B1D]">Sign Out of Salbeau</h3>
            <p className="text-xs text-[#6B5E65] mt-1 mb-5">
              Are you sure you want to end your current session?
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => setShowLogoutModal(false)}
                className="w-1/2 bg-white border border-[#E5E7EB] text-[#6B5E65] py-3 rounded-xl font-bold hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowLogoutModal(false);
                  if (logout) {
                    logout();
                  } else {
                    setCurrentScreen('onboarding');
                  }
                }}
                className="w-1/2 bg-[#C2477A] hover:bg-[#9E2D5B] text-white py-3 rounded-xl font-bold shadow-md transition-colors cursor-pointer"
              >
                Yes, Sign Out
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
