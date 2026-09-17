import React, { useState } from 'react';
import { useApp } from '../context/AppContext.jsx';
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
  Sparkles
} from 'lucide-react';

export const ProfileScreen = () => {
  const {
    userProfile,
    setUserProfile,
    userRole,
    setUserRole,
    toggleVerificationStatus,
    addresses,
    addAddress,
    deleteAddress,
    setDefaultAddress,
    setCurrentScreen
  } = useApp();

  const [isEditing, setIsEditing] = useState(false);
  const [profileForm, setProfileForm] = useState({ ...userProfile });
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [newAddrForm, setNewAddrForm] = useState({ label: 'Office', name: userProfile.name, phone: userProfile.phone, text: '', isDefault: false });
  const [showSupportModal, setShowSupportModal] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const isPendingVerification = userRole !== 'general' && userProfile.verificationStatus === 'pending';

  const roleTitles = {
    general: 'Retail Customer Account',
    salon: 'Salon Owner Partner',
    artist: 'Makeup Artist Partner',
    beautician: 'Beautician Partner'
  };

  const handleSaveProfile = (e) => {
    e.preventDefault();
    setUserProfile(profileForm);
    setIsEditing(false);
  };

  const handleAddAddressSubmit = (e) => {
    e.preventDefault();
    if (!newAddrForm.text.trim()) return;
    addAddress(newAddrForm);
    setNewAddrForm({ label: 'Office', name: userProfile.name, phone: userProfile.phone, text: '', isDefault: false });
    setShowAddressModal(false);
  };

  return (
    <div className="pb-28 min-h-screen bg-[#FFF8FA] animate-fade-in">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-white/95 backdrop-blur-md px-4 py-3 border-b border-[#FCE4EC] flex items-center justify-between">
        <h1 className="text-sm font-extrabold text-[#3A2430] uppercase tracking-wider">
          Account Profile & Settings
        </h1>
        <button
          onClick={() => setShowSupportModal(true)}
          className="text-[#C2477A] font-bold text-xs flex items-center gap-1"
        >
          <HelpCircle size={16} /> Helpdesk
        </button>
      </div>

      <div className="p-4 space-y-4 text-xs">
        {/* User Card */}
        <div className="p-4 bg-white rounded-2xl border border-[#FCE4EC] shadow-sm flex items-center gap-3">
          <div className="w-14 h-14 rounded-full bg-[#FCE4EC] text-[#C2477A] flex items-center justify-center font-bold text-xl shadow-inner">
            <User size={24} />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-sm font-extrabold text-[#3A2430] truncate">{userProfile.name}</h2>
            <span className="text-[11px] font-bold text-[#C2477A] bg-[#FCE4EC] px-2.5 py-0.5 rounded-full inline-block mt-0.5">
              {roleTitles[userRole]}
            </span>
            <span className="text-[10px] text-[#8C7078] block mt-0.5">{userProfile.phone} • {userProfile.email}</span>
          </div>
        </div>

        {/* Feature 2: Verification Pending State */}
        {userRole !== 'general' && (
          <div className={`p-4 rounded-2xl border transition-all ${
            isPendingVerification
              ? 'bg-amber-50 border-amber-200 text-amber-900 shadow-sm'
              : 'bg-emerald-50 border-emerald-200 text-emerald-900 shadow-sm'
          }`}>
            <div className="flex items-start justify-between gap-2 mb-2">
              <div className="flex items-center gap-2">
                {isPendingVerification ? (
                  <ShieldAlert size={20} className="text-amber-600" />
                ) : (
                  <ShieldCheck size={20} className="text-emerald-600" />
                )}
                <div>
                  <h3 className="font-extrabold text-xs">
                    {isPendingVerification ? 'Verification Pending' : 'Verified Partner Account'}
                  </h3>
                  <span className="text-[10px] opacity-90 block">
                    {isPendingVerification
                      ? 'Salbeau Admin verification under review. Retail MRP pricing currently active.'
                      : 'Tier pricing unlocked! Special partner discounts applied across catalog.'}
                  </span>
                </div>
              </div>
            </div>

            <button
              onClick={toggleVerificationStatus}
              className="mt-2 w-full py-2 bg-white text-xs font-bold rounded-xl border border-amber-300 text-amber-900 shadow-2xs hover:bg-amber-100"
            >
              🔄 Simulate Admin Verification ({isPendingVerification ? 'Approve Account' : 'Mark Pending'})
            </button>
          </div>
        )}

        {/* Feature 7: Editable Profile Section */}
        <div className="p-4 bg-white rounded-2xl border border-[#FCE4EC] shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-[#3A2430] uppercase tracking-wider text-[11px]">
              Personal & Business Information
            </h3>
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="text-[#C2477A] font-bold text-xs flex items-center gap-1"
            >
              <Edit2 size={13} /> {isEditing ? 'Cancel' : 'Edit Profile'}
            </button>
          </div>

          {isEditing ? (
            <form onSubmit={handleSaveProfile} className="space-y-3 pt-1">
              <div>
                <label className="block text-[#8C7078] font-bold text-[10px] uppercase mb-1">Full Name</label>
                <input
                  type="text"
                  value={profileForm.name}
                  onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-[#F5A8C0] bg-white outline-none text-xs text-[#3A2430]"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[#8C7078] font-bold text-[10px] uppercase mb-1">Phone Number</label>
                  <input
                    type="text"
                    value={profileForm.phone}
                    onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-[#F5A8C0] bg-white outline-none text-xs text-[#3A2430]"
                  />
                </div>
                <div>
                  <label className="block text-[#8C7078] font-bold text-[10px] uppercase mb-1">Email Address</label>
                  <input
                    type="email"
                    value={profileForm.email}
                    onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-[#F5A8C0] bg-white outline-none text-xs text-[#3A2430]"
                  />
                </div>
              </div>

              {userRole !== 'general' && (
                <div className="grid grid-cols-2 gap-2 pt-1 border-t border-[#FCE4EC]">
                  <div>
                    <label className="block text-[#8C7078] font-bold text-[10px] uppercase mb-1">Business Name</label>
                    <input
                      type="text"
                      value={profileForm.businessName}
                      onChange={(e) => setProfileForm({ ...profileForm, businessName: e.target.value })}
                      className="w-full p-2.5 rounded-xl border border-[#F5A8C0] bg-white outline-none text-xs text-[#3A2430]"
                    />
                  </div>
                  <div>
                    <label className="block text-[#8C7078] font-bold text-[10px] uppercase mb-1">GST / Cert ID</label>
                    <input
                      type="text"
                      value={profileForm.gstNo}
                      onChange={(e) => setProfileForm({ ...profileForm, gstNo: e.target.value })}
                      className="w-full p-2.5 rounded-xl border border-[#F5A8C0] bg-white outline-none text-xs text-[#3A2430]"
                    />
                  </div>
                </div>
              )}

              <button
                type="submit"
                className="w-full py-3 bg-[#C2477A] text-white font-bold text-xs rounded-xl shadow-sm"
              >
                Save Profile Changes
              </button>
            </form>
          ) : (
            <div className="space-y-2 text-[#3A2430]">
              <div className="flex justify-between py-1 border-b border-[#FFF8FA]">
                <span className="text-[#8C7078]">Full Name:</span>
                <span className="font-bold">{userProfile.name}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#FFF8FA]">
                <span className="text-[#8C7078]">Phone Number:</span>
                <span className="font-semibold">{userProfile.phone}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#FFF8FA]">
                <span className="text-[#8C7078]">Email:</span>
                <span className="font-semibold">{userProfile.email}</span>
              </div>
              {userRole !== 'general' && (
                <>
                  <div className="flex justify-between py-1 border-b border-[#FFF8FA]">
                    <span className="text-[#8C7078]">Business Name:</span>
                    <span className="font-bold text-[#C2477A]">{userProfile.businessName}</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-[#8C7078]">GST / Registration No:</span>
                    <span className="font-semibold">{userProfile.gstNo}</span>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* Feature 3: Address Management Section */}
        <div className="p-4 bg-white rounded-2xl border border-[#FCE4EC] shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-[#3A2430] uppercase tracking-wider text-[11px] flex items-center gap-1.5">
              <MapPin size={15} className="text-[#C2477A]" /> Saved Address Book ({addresses.length})
            </h3>
            <button
              onClick={() => setShowAddressModal(true)}
              className="text-[#C2477A] font-bold text-xs flex items-center gap-1"
            >
              <Plus size={14} /> Add New
            </button>
          </div>

          <div className="space-y-2">
            {addresses.map((addr) => (
              <div key={addr.id} className="p-3 bg-[#FFF8FA] rounded-xl border border-[#FCE4EC] space-y-1.5">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-[#3A2430] text-xs">{addr.label}</span>
                    {addr.isDefault ? (
                      <span className="text-[9px] bg-[#C2477A] text-white px-1.5 py-0.5 rounded font-bold">Default</span>
                    ) : (
                      <button
                        onClick={() => setDefaultAddress(addr.id)}
                        className="text-[9px] text-[#C2477A] underline font-bold"
                      >
                        Set Default
                      </button>
                    )}
                  </div>
                  <button
                    onClick={() => deleteAddress(addr.id)}
                    className="text-gray-400 hover:text-rose-600 p-1"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
                <p className="text-[11px] text-[#8C7078] leading-snug">{addr.text}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Feature 7: Logout Action */}
        <button
          onClick={() => setShowLogoutModal(true)}
          className="w-full py-3.5 bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold text-xs rounded-2xl border border-rose-200 flex items-center justify-center gap-2 cursor-pointer shadow-2xs"
        >
          <LogOut size={16} /> Log Out Account
        </button>
      </div>

      {/* Add Address Modal */}
      {showAddressModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl border border-[#FCE4EC] shadow-2xl w-full max-w-sm p-6 relative overflow-hidden text-xs">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-[#FCE4EC]">
              <h3 className="font-extrabold text-sm text-[#3A2430]">Add Saved Address</h3>
              <button onClick={() => setShowAddressModal(false)} className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center text-gray-500">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleAddAddressSubmit} className="space-y-3">
              <div>
                <label className="block text-[#8C7078] font-bold text-[10px] uppercase mb-1">Address Label</label>
                <input
                  type="text"
                  placeholder="Home / Salon / Studio"
                  value={newAddrForm.label}
                  onChange={(e) => setNewAddrForm({ ...newAddrForm, label: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-[#F5A8C0] bg-white text-xs outline-none"
                />
              </div>

              <div>
                <label className="block text-[#8C7078] font-bold text-[10px] uppercase mb-1">Address Text</label>
                <textarea
                  rows={3}
                  required
                  placeholder="House/Building No, Street, Landmark, Area, City, Pincode..."
                  value={newAddrForm.text}
                  onChange={(e) => setNewAddrForm({ ...newAddrForm, text: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-[#F5A8C0] bg-white text-xs outline-none"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="chkDefault"
                  checked={newAddrForm.isDefault}
                  onChange={(e) => setNewAddrForm({ ...newAddrForm, isDefault: e.target.checked })}
                  className="accent-[#C2477A]"
                />
                <label htmlFor="chkDefault" className="text-xs font-semibold text-[#3A2430]">Set as default shipping address</label>
              </div>

              <button
                type="submit"
                className="w-full mt-3 bg-[#C2477A] text-white py-3 rounded-xl font-bold text-xs"
              >
                Save Address
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Feature 9: Support Modal */}
      {showSupportModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl border border-[#FCE4EC] shadow-2xl w-full max-w-sm p-6 relative overflow-hidden text-xs text-center">
            <div className="w-12 h-12 rounded-2xl bg-[#FCE4EC] text-[#C2477A] flex items-center justify-center font-bold mx-auto mb-3">
              <HelpCircle size={24} />
            </div>

            <h3 className="font-extrabold text-base text-[#3A2430]">Salbeau Store Support</h3>
            <p className="text-xs text-[#8C7078] mt-1 mb-5">
              Need assistance with your account, role pricing verification, or orders?
            </p>

            <div className="space-y-2.5 text-left">
              <a href="tel:+918007252328" className="p-3 bg-[#FFF8FA] hover:bg-[#FCE4EC] rounded-xl border border-[#FCE4EC] flex items-center gap-3 font-bold text-[#3A2430]">
                <Phone size={18} className="text-[#C2477A]" />
                <div>
                  <span className="block text-xs">Call Customer Desk</span>
                  <span className="text-[10px] text-[#8C7078] font-normal">+91 800 725 2328 (Toll Free)</span>
                </div>
              </a>

              <a href="https://wa.me/919876543210" target="_blank" rel="noreferrer" className="p-3 bg-[#FFF8FA] hover:bg-[#FCE4EC] rounded-xl border border-[#FCE4EC] flex items-center gap-3 font-bold text-[#3A2430]">
                <MessageCircle size={18} className="text-emerald-600" />
                <div>
                  <span className="block text-xs">WhatsApp Helpdesk</span>
                  <span className="text-[10px] text-[#8C7078] font-normal">+91 98765 43210</span>
                </div>
              </a>
            </div>

            <button onClick={() => setShowSupportModal(false)} className="w-full mt-5 bg-gray-100 text-gray-700 py-3 rounded-xl font-bold">
              Close Helpdesk
            </button>
          </div>
        </div>
      )}

      {/* Logout Modal */}
      {showLogoutModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl border border-[#FCE4EC] shadow-2xl w-full max-w-sm p-6 relative overflow-hidden text-center text-xs">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold mx-auto mb-3">
              <LogOut size={24} />
            </div>

            <h3 className="font-extrabold text-base text-[#3A2430]">Log Out Salbeau Account</h3>
            <p className="text-xs text-[#8C7078] mt-1 mb-5">
              Are you sure you want to log out of your mobile account session?
            </p>

            <div className="flex gap-3">
              <button onClick={() => setShowLogoutModal(false)} className="w-1/2 bg-gray-100 text-gray-700 py-3 rounded-xl font-bold">
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowLogoutModal(false);
                  setCurrentScreen('onboarding');
                }}
                className="w-1/2 bg-rose-600 text-white py-3 rounded-xl font-bold"
              >
                Yes, Log Out
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
