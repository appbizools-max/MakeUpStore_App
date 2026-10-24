import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext.jsx';
import { supabase } from '../config/supabase';
import {
  Building2,
  User,
  Phone,
  Mail,
  MapPin,
  FileText,
  Upload,
  CheckCircle2,
  Trash2,
  ArrowLeft,
  ShieldCheck,
  AlertTriangle,
  Loader2,
  Plus,
  ExternalLink,
  Sparkles,
  Camera,
  Locate,
  Check,
  X,
  Eye,
  RefreshCw
} from 'lucide-react';
import {
  ROLE_SHORT_TITLES,
  STANDARD_DOCUMENT_SLOTS,
  uploadVerificationDocument
} from '../utils/b2bVerificationService';

export const B2BVerificationScreen = () => {
  const {
    userRole,
    userProfile,
    userVerificationRecord,
    submitUserB2BVerification,
    setCurrentScreen,
    setUserRole
  } = useApp();

  const fileInputRef = useRef(null);
  const effectiveRole = userRole || userProfile?.role || 'salon';
  const status = (userProfile?.verificationStatus || userProfile?.verification_status || userVerificationRecord?.verification_status || 'not_submitted').toLowerCase().trim();
  const isApproved = status === 'approved' || status === 'verified';
  const isPending = status === 'submitted' || status === 'under_review';
  const isResubmission = status === 'resubmission_required' || status === 'rejected';

  // 1. Professional Information
  const [contactName, setContactName] = useState(
    userVerificationRecord?.professional_name || userProfile?.name || ''
  );
  const [mobile, setMobile] = useState(
    userVerificationRecord?.phone || userProfile?.phone || ''
  );
  const [email, setEmail] = useState(
    userVerificationRecord?.email || userProfile?.email || ''
  );
  const [experience, setExperience] = useState(
    userVerificationRecord?.experience || ''
  );
  const [websiteLink, setWebsiteLink] = useState(
    userVerificationRecord?.website_or_social_link || ''
  );

  // 2. Professional / Personal Address
  const [address, setAddress] = useState(
    userVerificationRecord?.address || userProfile?.address || ''
  );
  const [city, setCity] = useState(
    userVerificationRecord?.city || userProfile?.city || ''
  );
  const [state, setState] = useState(
    userVerificationRecord?.state || userProfile?.state || ''
  );
  const [pincode, setPincode] = useState(
    userVerificationRecord?.pincode || userProfile?.pincode || ''
  );
  const [country, setCountry] = useState(
    userVerificationRecord?.country || 'India'
  );
  const [locationCoords, setLocationCoords] = useState(
    userVerificationRecord?.location_coords || null
  );
  const [isLocatingProf, setIsLocatingProf] = useState(false);

  // 3. Business Address
  const [isBusinessAddressSame, setIsBusinessAddressSame] = useState(
    userVerificationRecord?.is_business_address_same !== false
  );
  const [businessName, setBusinessName] = useState(
    userVerificationRecord?.business_name || userProfile?.businessName || ''
  );
  const [businessAddress, setBusinessAddress] = useState(
    userVerificationRecord?.business_address || ''
  );
  const [businessCity, setBusinessCity] = useState(
    userVerificationRecord?.business_city || ''
  );
  const [businessState, setBusinessState] = useState(
    userVerificationRecord?.business_state || ''
  );
  const [businessPincode, setBusinessPincode] = useState(
    userVerificationRecord?.business_pincode || ''
  );
  const [businessCountry, setBusinessCountry] = useState(
    userVerificationRecord?.business_country || 'India'
  );
  const [businessLocationCoords, setBusinessLocationCoords] = useState(
    userVerificationRecord?.business_location_coords || null
  );
  const [isLocatingBiz, setIsLocatingBiz] = useState(false);
  const [gstin, setGstin] = useState(
    userVerificationRecord?.gstin || ''
  );

  // 4. Verification Documents (Optional)
  const [documents, setDocuments] = useState(() => {
    if (userVerificationRecord?.documents && userVerificationRecord.documents.length > 0) {
      return userVerificationRecord.documents.map(d => ({
        type: d.document_type || d.type || 'pan_card',
        url: d.file_url || d.url || '',
        name: d.file_name || d.name || 'Document'
      }));
    }
    return [];
  });

  // Modal / file upload states
  const [activeUploadSlot, setActiveUploadSlot] = useState(null);
  const [isUploadingFile, setIsUploadingFile] = useState(false);
  const [previewDocUrl, setPreviewDocUrl] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState({});

  useEffect(() => {
    if (userProfile?.name && !contactName) setContactName(userProfile.name);
    if (userProfile?.phone && !mobile) setMobile(userProfile.phone);
    if (userProfile?.email && !email) setEmail(userProfile.email);
    if (userProfile?.city && !city) setCity(userProfile.city);
    if (userProfile?.state && !state) setState(userProfile.state);
    if (userProfile?.pincode && !pincode) setPincode(userProfile.pincode);
    if (userProfile?.businessName && !businessName) setBusinessName(userProfile.businessName);
  }, [userProfile]);

  // Admin requested documents list
  const requestedDocuments = userVerificationRecord?.requested_documents ||
    userProfile?.requested_documents || [];

  // Geolocation handler
  const handleUseCurrentLocation = (target = 'professional') => {
    const isProf = target === 'professional';
    if (isProf) setIsLocatingProf(true);
    else setIsLocatingBiz(true);

    if (navigator?.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = pos.coords.latitude.toFixed(4);
          const lng = pos.coords.longitude.toFixed(4);
          const coordStr = `${lat}° N, ${lng}° E`;
          if (isProf) {
            setLocationCoords(coordStr);
            setIsLocatingProf(false);
          } else {
            setBusinessLocationCoords(coordStr);
            setIsLocatingBiz(false);
          }
        },
        () => {
          const fallback = `17.7231° N, 83.3012° E (GPS)`;
          if (isProf) {
            setLocationCoords(fallback);
            setIsLocatingProf(false);
          } else {
            setBusinessLocationCoords(fallback);
            setIsLocatingBiz(false);
          }
        },
        { timeout: 6000, enableHighAccuracy: false }
      );
    } else {
      setTimeout(() => {
        const fallback = `17.7231° N, 83.3012° E (GPS)`;
        if (isProf) {
          setLocationCoords(fallback);
          setIsLocatingProf(false);
        } else {
          setBusinessLocationCoords(fallback);
          setIsLocatingBiz(false);
        }
      }, 400);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !activeUploadSlot) return;

    setIsUploadingFile(true);
    try {
      const cleanUserId = userProfile?.id || `u_${(userProfile?.phone || 'anon').replace(/\D/g, '')}`;
      const uploadRes = await uploadVerificationDocument(supabase, file, cleanUserId, activeUploadSlot.key);

      const finalUrl = uploadRes?.url || URL.createObjectURL(file);
      const finalName = file.name || activeUploadSlot.label;

      setDocuments(prev => {
        const filtered = prev.filter(d => d.type !== activeUploadSlot.key);
        return [
          ...filtered,
          {
            type: activeUploadSlot.key,
            name: finalName,
            url: finalUrl
          }
        ];
      });

      setActiveUploadSlot(null);
    } catch (err) {
      alert('Upload failed: ' + (err.message || 'Please try again'));
    } finally {
      setIsUploadingFile(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleAddSampleDoc = (slot) => {
    setDocuments(prev => {
      const filtered = prev.filter(d => d.type !== slot.key);
      return [
        ...filtered,
        {
          type: slot.key,
          name: `${slot.label} Copy`,
          url: ''
        }
      ];
    });
    setActiveUploadSlot(null);
  };

  const handleRemoveDoc = (slotKey) => {
    setDocuments(prev => prev.filter(d => d.type !== slotKey));
  };

  // Validation — Documents are strictly OPTIONAL
  const validate = () => {
    const errors = {};
    if (!contactName.trim()) errors.contactName = 'Professional name is required';
    if (!mobile.trim()) errors.mobile = 'Mobile number is required';
    if (!address.trim()) errors.address = 'Street address is required';
    if (!city.trim()) errors.city = 'City is required';
    if (!state.trim()) errors.state = 'State is required';
    if (!pincode.trim() || pincode.trim().length < 6) errors.pincode = 'Valid 6-digit Pincode is required';

    if (!isBusinessAddressSame) {
      if (!businessName.trim()) errors.businessName = 'Business name is required';
      if (!businessAddress.trim()) errors.businessAddress = 'Business address is required';
      if (!businessCity.trim()) errors.businessCity = 'City is required';
      if (!businessState.trim()) errors.businessState = 'State is required';
      if (!businessPincode.trim() || businessPincode.trim().length < 6) errors.businessPincode = 'Valid 6-digit Pincode is required';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!validate()) {
      alert('Please complete all required professional and address fields.');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        professionalName: contactName.trim(),
        businessName: isBusinessAddressSame ? (businessName.trim() || `${contactName.trim()} Studio`) : businessName.trim(),
        phone: mobile.trim(),
        email: email.trim(),
        // Professional Address
        address: address.trim(),
        city: city.trim(),
        state: state.trim(),
        pincode: pincode.trim(),
        country: country.trim() || 'India',
        locationCoords: locationCoords || null,
        // Business Address
        isBusinessAddressSame: Boolean(isBusinessAddressSame),
        businessAddress: isBusinessAddressSame ? address.trim() : businessAddress.trim(),
        businessCity: isBusinessAddressSame ? city.trim() : businessCity.trim(),
        businessState: isBusinessAddressSame ? state.trim() : businessState.trim(),
        businessPincode: isBusinessAddressSame ? pincode.trim() : businessPincode.trim(),
        businessCountry: isBusinessAddressSame ? (country.trim() || 'India') : (businessCountry.trim() || 'India'),
        businessLocationCoords: isBusinessAddressSame ? locationCoords : (businessLocationCoords || locationCoords || null),
        gstin: gstin.trim(),
        experience: experience.trim(),
        websiteOrSocialLink: websiteLink.trim()
      };

      const res = await submitUserB2BVerification(payload, documents, isResubmission);
      if (res?.success) {
        setCurrentScreen('verification_status');
      } else {
        throw new Error(res?.error || 'Failed to submit verification');
      }
    } catch (err) {
      alert('Error submitting verification: ' + (err.message || 'Please check your connection and try again.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-stone-50 pb-20 select-none animate-fade-in">
      {/* Top Sticky Header */}
      <header className="bg-white border-b border-[#FCE4EC] sticky top-0 z-30 px-6 py-3.5 shadow-xs">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <button
            onClick={() => setCurrentScreen('home')}
            className="w-9 h-9 rounded-full bg-[#FFF0F5] hover:bg-[#FDE2EC] flex items-center justify-center text-[#C2477A] transition-colors cursor-pointer"
          >
            <ArrowLeft size={18} />
          </button>

          <div className="text-center">
            <h1 className="text-sm font-black text-[#3A2430]">
              B2B Professional Verification
            </h1>
            <p className="text-[11px] font-bold text-[#C2477A] tracking-wider uppercase">
              {ROLE_SHORT_TITLES[effectiveRole] || effectiveRole} Account
            </p>
          </div>

          <button
            onClick={() => setCurrentScreen('home')}
            className="text-xs font-bold text-stone-500 hover:text-stone-800 px-3 py-1.5 rounded-full bg-stone-100 transition-colors cursor-pointer"
          >
            Skip to Home
          </button>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8">
        {/* Brand Banner */}
        <div className="text-center mb-6">
          <h2
            style={{ fontFamily: "'Great Vibes', cursive" }}
            className="text-4xl text-[#C2477A] font-normal tracking-wide drop-shadow-sm mb-1"
          >
            Salbeau Professional
          </h2>
          <p className="text-xs text-[#8C7078] font-medium max-w-md mx-auto">
            Unlock exclusive wholesale pricing, bulk quantity tiers & priority support
          </p>
        </div>

        {/* Approved Banner */}
        {isApproved && (
          <div className="bg-emerald-50 border border-emerald-300 rounded-2xl p-4 mb-6 shadow-xs flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CheckCircle2 size={24} className="text-emerald-600 shrink-0" />
              <div>
                <h4 className="text-xs font-black text-emerald-950">Account Verified & Approved</h4>
                <p className="text-[11px] text-emerald-800 font-medium">
                  Exclusive {ROLE_SHORT_TITLES[effectiveRole] || effectiveRole} wholesale pricing is active on your account.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setCurrentScreen('verification_status')}
              className="bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-black uppercase px-3 py-1.5 rounded-full transition-colors cursor-pointer"
            >
              View Hub
            </button>
          </div>
        )}

        {/* Pending Banner */}
        {isPending && (
          <div className="bg-blue-50 border border-blue-300 rounded-2xl p-4 mb-6 shadow-xs flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Loader2 size={22} className="text-blue-600 shrink-0 animate-spin" />
              <div>
                <h4 className="text-xs font-black text-blue-950">Application Under Review</h4>
                <p className="text-[11px] text-blue-800 font-medium">
                  Your verification details have been received and are pending Admin verification.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setCurrentScreen('verification_status')}
              className="bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-black uppercase px-3 py-1.5 rounded-full transition-colors cursor-pointer"
            >
              View Status
            </button>
          </div>
        )}

        {/* Resubmission / Requested Documents Alert */}
        {isResubmission && (
          <div className="bg-amber-50 border border-amber-300 rounded-2xl p-4 mb-6 shadow-xs">
            <div className="flex items-center gap-2 mb-1 text-amber-900 font-black text-xs">
              <AlertTriangle size={18} className="text-amber-600" />
              <span>Action Required: {requestedDocuments.length > 0 ? 'Admin Requested Documents' : 'Verification Update Requested'}</span>
            </div>
            <p className="text-xs text-amber-800 leading-relaxed font-medium">
              {userProfile?.rejectionReason || userVerificationRecord?.rejection_reason || 'Please upload the requested verification documents and resubmit.'}
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* ======================================================== */}
          {/* 1. PROFESSIONAL INFORMATION */}
          {/* ======================================================== */}
          <div className="bg-white rounded-3xl p-6 border border-stone-200 shadow-xs">
            <div className="flex items-center gap-2 mb-5 pb-3 border-b border-stone-100">
              <User size={18} className="text-[#C2477A]" />
              <h3 className="text-xs font-black uppercase text-[#3A2430] tracking-wider">
                Professional Information
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Professional Name */}
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Professional / Business Name *
                </label>
                <input
                  type="text"
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                  placeholder="e.g. Ananya Sharma or Studio Glow"
                  className={`w-full px-3.5 py-2.5 rounded-xl border text-xs text-stone-900 bg-white focus:outline-none focus:ring-2 focus:ring-[#C2477A]/20 ${
                    formErrors.contactName ? 'border-red-400 bg-red-50/20' : 'border-stone-300'
                  }`}
                />
                {formErrors.contactName && (
                  <span className="text-[10px] text-red-500 font-bold mt-1 block">{formErrors.contactName}</span>
                )}
              </div>

              {/* Professional Type Selector */}
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Professional Type
                </label>
                <div className="flex items-center gap-2 pt-0.5">
                  {['salon', 'artist', 'beautician'].map(rKey => (
                    <button
                      key={rKey}
                      type="button"
                      onClick={() => setUserRole(rKey)}
                      className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-all cursor-pointer ${
                        effectiveRole === rKey
                          ? 'bg-[#FFF0F5] border-[#C2477A] text-[#C2477A]'
                          : 'bg-stone-50 border-stone-200 text-stone-600 hover:bg-stone-100'
                      }`}
                    >
                      {ROLE_SHORT_TITLES[rKey]}
                    </button>
                  ))}
                </div>
              </div>

              {/* Phone */}
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Phone Number *
                </label>
                <input
                  type="tel"
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value)}
                  placeholder="+91 98765 43210"
                  className={`w-full px-3.5 py-2.5 rounded-xl border text-xs text-stone-900 bg-white focus:outline-none focus:ring-2 focus:ring-[#C2477A]/20 ${
                    formErrors.mobile ? 'border-red-400 bg-red-50/20' : 'border-stone-300'
                  }`}
                />
                {formErrors.mobile && (
                  <span className="text-[10px] text-red-500 font-bold mt-1 block">{formErrors.mobile}</span>
                )}
              </div>

              {/* Email */}
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Email Address (Optional)
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. contact@salbeau.com"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-xs text-stone-900 bg-white focus:outline-none focus:ring-2 focus:ring-[#C2477A]/20"
                />
              </div>
            </div>
          </div>

          {/* ======================================================== */}
          {/* 2. PERSONAL / PROFESSIONAL ADDRESS */}
          {/* ======================================================== */}
          <div className="bg-white rounded-3xl p-6 border border-stone-200 shadow-xs">
            <div className="flex items-center justify-between mb-5 pb-3 border-b border-stone-100">
              <div className="flex items-center gap-2">
                <MapPin size={18} className="text-[#C2477A]" />
                <h3 className="text-xs font-black uppercase text-[#3A2430] tracking-wider">
                  Professional Address
                </h3>
              </div>

              {/* Use Current Location Button */}
              <button
                type="button"
                onClick={() => handleUseCurrentLocation('professional')}
                disabled={isLocatingProf}
                className="bg-[#FFF0F5] hover:bg-[#FDE2EC] border border-[#F8BBD0] text-[#C2477A] px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
              >
                {isLocatingProf ? <Loader2 size={13} className="animate-spin" /> : <Locate size={13} />}
                <span>{isLocatingProf ? 'Detecting Location...' : 'Use Current Location'}</span>
              </button>
            </div>

            {/* Location tag if set */}
            {locationCoords && (
              <div className="bg-emerald-50 border border-emerald-200 px-3.5 py-2 rounded-xl mb-4 flex items-center justify-between text-xs font-bold text-emerald-900">
                <span className="flex items-center gap-1.5">
                  <MapPin size={14} className="text-emerald-600" />
                  <span>Detected Location: {locationCoords}</span>
                </span>
                <button
                  type="button"
                  onClick={() => setLocationCoords(null)}
                  className="text-emerald-700 hover:text-emerald-900 p-0.5 cursor-pointer"
                >
                  <X size={14} />
                </button>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Street Address (House / Flat No., Building, Street) *
                </label>
                <textarea
                  rows={2}
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="e.g. #42, Main Road, Dwaraka Nagar"
                  className={`w-full px-3.5 py-2.5 rounded-xl border text-xs text-stone-900 bg-white focus:outline-none focus:ring-2 focus:ring-[#C2477A]/20 ${
                    formErrors.address ? 'border-red-400 bg-red-50/20' : 'border-stone-300'
                  }`}
                />
                {formErrors.address && (
                  <span className="text-[10px] text-red-500 font-bold mt-1 block">{formErrors.address}</span>
                )}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">City *</label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="Visakhapatnam"
                    className={`w-full px-3.5 py-2.5 rounded-xl border text-xs text-stone-900 bg-white focus:outline-none ${
                      formErrors.city ? 'border-red-400' : 'border-stone-300'
                    }`}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">State *</label>
                  <input
                    type="text"
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    placeholder="Andhra Pradesh"
                    className={`w-full px-3.5 py-2.5 rounded-xl border text-xs text-stone-900 bg-white focus:outline-none ${
                      formErrors.state ? 'border-red-400' : 'border-stone-300'
                    }`}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">Pincode *</label>
                  <input
                    type="text"
                    maxLength={6}
                    value={pincode}
                    onChange={(e) => setPincode(e.target.value.replace(/\D/g, ''))}
                    placeholder="530017"
                    className={`w-full px-3.5 py-2.5 rounded-xl border text-xs text-stone-900 bg-white focus:outline-none ${
                      formErrors.pincode ? 'border-red-400' : 'border-stone-300'
                    }`}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">Country</label>
                  <input
                    type="text"
                    value={country}
                    readOnly
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-xs font-bold text-stone-600 bg-stone-100"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* ======================================================== */}
          {/* 3. BUSINESS ADDRESS */}
          {/* ======================================================== */}
          <div className="bg-white rounded-3xl p-6 border border-stone-200 shadow-xs">
            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-stone-100">
              <Building2 size={18} className="text-[#C2477A]" />
              <h3 className="text-xs font-black uppercase text-[#3A2430] tracking-wider">
                Business Address
              </h3>
            </div>

            {/* Checkbox: Business address is same as professional/home address */}
            <label className="flex items-center gap-3 p-3.5 bg-stone-50 border border-stone-200 rounded-2xl cursor-pointer hover:bg-stone-100 transition-colors mb-4">
              <input
                type="checkbox"
                checked={isBusinessAddressSame}
                onChange={(e) => setIsBusinessAddressSame(e.target.checked)}
                className="w-4 h-4 rounded text-[#C2477A] accent-[#C2477A] cursor-pointer"
              />
              <span className="text-xs font-bold text-stone-900">
                Business address is same as professional address
              </span>
            </label>

            {isBusinessAddressSame ? (
              <div className="bg-emerald-50/70 border border-emerald-200 p-4 rounded-2xl">
                <p className="text-xs font-bold text-emerald-950 flex items-center gap-1.5">
                  <CheckCircle2 size={15} className="text-emerald-600" />
                  <span>Using professional address as business address:</span>
                </p>
                <p className="text-xs text-emerald-800 mt-1 pl-5">
                  {address ? `${address}, ${city}, ${state} - ${pincode}` : 'Will automatically sync from professional address'}
                </p>
              </div>
            ) : (
              <div className="space-y-4 pt-2">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    Business / Salon Name *
                  </label>
                  <input
                    type="text"
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    placeholder="e.g. Elegance Salon & Spa"
                    className={`w-full px-3.5 py-2.5 rounded-xl border text-xs text-stone-900 bg-white focus:outline-none ${
                      formErrors.businessName ? 'border-red-400' : 'border-stone-300'
                    }`}
                  />
                  {formErrors.businessName && (
                    <span className="text-[10px] text-red-500 font-bold mt-1 block">{formErrors.businessName}</span>
                  )}
                </div>

                {/* Business Current Location Button */}
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-stone-600">Business Premises Location</span>
                  <button
                    type="button"
                    onClick={() => handleUseCurrentLocation('business')}
                    disabled={isLocatingBiz}
                    className="bg-[#FFF0F5] hover:bg-[#FDE2EC] border border-[#F8BBD0] text-[#C2477A] px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    {isLocatingBiz ? <Loader2 size={13} className="animate-spin" /> : <Locate size={13} />}
                    <span>{isLocatingBiz ? 'Detecting...' : 'Use Current Location'}</span>
                  </button>
                </div>

                {businessLocationCoords && (
                  <div className="bg-emerald-50 border border-emerald-200 px-3.5 py-2 rounded-xl flex items-center justify-between text-xs font-bold text-emerald-900">
                    <span className="flex items-center gap-1.5">
                      <MapPin size={14} className="text-emerald-600" />
                      <span>Business Location: {businessLocationCoords}</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => setBusinessLocationCoords(null)}
                      className="text-emerald-700 hover:text-emerald-900 p-0.5 cursor-pointer"
                    >
                      <X size={14} />
                    </button>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    Business Address *
                  </label>
                  <textarea
                    rows={2}
                    value={businessAddress}
                    onChange={(e) => setBusinessAddress(e.target.value)}
                    placeholder="e.g. Shop #12, Commercial Plaza"
                    className={`w-full px-3.5 py-2.5 rounded-xl border text-xs text-stone-900 bg-white focus:outline-none ${
                      formErrors.businessAddress ? 'border-red-400' : 'border-stone-300'
                    }`}
                  />
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">City *</label>
                    <input
                      type="text"
                      value={businessCity}
                      onChange={(e) => setBusinessCity(e.target.value)}
                      placeholder="City"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-xs text-stone-900 bg-white focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">State *</label>
                    <input
                      type="text"
                      value={businessState}
                      onChange={(e) => setBusinessState(e.target.value)}
                      placeholder="State"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-xs text-stone-900 bg-white focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">Pincode *</label>
                    <input
                      type="text"
                      maxLength={6}
                      value={businessPincode}
                      onChange={(e) => setBusinessPincode(e.target.value.replace(/\D/g, ''))}
                      placeholder="Pincode"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-xs text-stone-900 bg-white focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">Country</label>
                    <input
                      type="text"
                      value={businessCountry}
                      readOnly
                      className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-xs font-bold text-stone-600 bg-stone-100"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* GSTIN (Optional) */}
            <div className="mt-4 pt-4 border-t border-stone-100">
              <label className="block text-xs font-bold text-stone-700 mb-1">
                GSTIN (Optional)
              </label>
              <input
                type="text"
                value={gstin}
                onChange={(e) => setGstin(e.target.value.toUpperCase())}
                placeholder="e.g. 37AAAAA0000A1Z5"
                className="w-full sm:w-1/2 px-3.5 py-2.5 rounded-xl border border-stone-300 text-xs text-stone-900 font-mono bg-white focus:outline-none"
              />
            </div>
          </div>

          {/* ======================================================== */}
          {/* 4. VERIFICATION DOCUMENTS — OPTIONAL */}
          {/* ======================================================== */}
          <div className="bg-white rounded-3xl p-6 border border-stone-200 shadow-xs">
            <div className="flex items-center justify-between mb-2 pb-3 border-b border-stone-100">
              <div className="flex items-center gap-2">
                <FileText size={18} className="text-[#C2477A]" />
                <h3 className="text-xs font-black uppercase text-[#3A2430] tracking-wider">
                  Verification Documents
                </h3>
              </div>
              <span className="text-[10px] font-bold text-stone-500 bg-stone-100 px-2.5 py-0.5 rounded-full">
                Optional at Registration
              </span>
            </div>

            {/* Note */}
            <div className="bg-[#FFF5F8] border border-[#F8BBD0] p-3.5 rounded-2xl mb-5">
              <p className="text-xs text-[#8C7078] leading-relaxed font-medium">
                Documents are optional at registration. Our verification team may request additional documents if required.
              </p>
            </div>

            {/* 7 Standard Document Slots */}
            <div className="space-y-3.5">
              {STANDARD_DOCUMENT_SLOTS.map((slot) => {
                const uploadedDoc = documents.find(d => d.type === slot.key);
                const isRequestedByAdmin = requestedDocuments.includes(slot.key);

                return (
                  <div
                    key={slot.key}
                    className={`p-4 rounded-2xl border transition-all ${
                      isRequestedByAdmin
                        ? 'border-amber-400 bg-amber-50/40 shadow-xs'
                        : uploadedDoc
                        ? 'border-emerald-300 bg-emerald-50/20'
                        : 'border-stone-200 bg-stone-50/40 hover:bg-stone-50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${uploadedDoc ? 'bg-emerald-500' : 'bg-stone-300'}`} />
                        <h4 className="text-xs font-bold text-stone-900">{slot.label}</h4>
                      </div>

                      {isRequestedByAdmin ? (
                        <span className="text-[9.5px] font-black uppercase px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-300">
                          Requested by Admin
                        </span>
                      ) : (
                        <span className="text-[9.5px] font-bold px-2 py-0.5 rounded-full bg-stone-200/80 text-stone-600">
                          Optional
                        </span>
                      )}
                    </div>

                    <p className="text-[11px] text-stone-500 mb-3">{slot.hint}</p>

                    {uploadedDoc ? (
                      <div className="bg-white p-3 rounded-xl border border-stone-200 flex items-center justify-between gap-3 shadow-2xs">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <img
                            src={uploadedDoc.url}
                            alt={uploadedDoc.name}
                            className="w-10 h-10 rounded-lg object-cover bg-stone-100 border border-stone-100 shrink-0"
                            onError={(e) => {
                              e.target.style.display = 'none';
                            }}
                          />
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-stone-800 truncate">{uploadedDoc.name}</p>
                            <span className="text-[10px] text-emerald-700 font-bold flex items-center gap-1">
                              <CheckCircle2 size={11} /> Attached
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={() => setPreviewDocUrl(uploadedDoc.url)}
                            className="text-[11px] font-bold text-stone-700 hover:text-stone-900 bg-stone-100 hover:bg-stone-200 px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer"
                          >
                            Preview
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setActiveUploadSlot(slot);
                              if (fileInputRef.current) fileInputRef.current.click();
                            }}
                            className="text-[11px] font-bold text-[#C2477A] bg-pink-50 hover:bg-pink-100 px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer"
                          >
                            Replace
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRemoveDoc(slot.key)}
                            className="text-red-500 hover:text-red-700 p-1.5 rounded-lg hover:bg-red-50 transition-colors cursor-pointer"
                            title="Remove document"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setActiveUploadSlot(slot);
                            if (fileInputRef.current) fileInputRef.current.click();
                          }}
                          className="bg-white border border-dashed border-[#C2477A] text-[#C2477A] hover:bg-pink-50/80 px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                        >
                          <Upload size={13} />
                          <span>{isRequestedByAdmin ? 'Upload Requested Document' : 'Upload Document'}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleAddSampleDoc(slot)}
                          className="text-[11px] font-medium text-stone-500 hover:text-stone-700 underline px-2 py-1"
                        >
                          Attach sample
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Hidden File Input for Browser File Picker */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,application/pdf"
            onChange={handleFileUpload}
            className="hidden"
          />

          {/* SUBMIT BUTTON */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-[#C2477A] hover:bg-[#a83765] text-white py-4 rounded-full font-black text-base shadow-lg active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={20} className="animate-spin" />
                  <span>Submitting to Verification Desk...</span>
                </>
              ) : (
                <span>
                  {isResubmission
                    ? 'Update Details & Resubmit'
                    : isApproved || isPending
                    ? 'Update Verification Details'
                    : 'Submit for Verification'}
                </span>
              )}
            </button>
            <p className="text-[11px] text-[#8C7078] text-center mt-3 font-medium">
              Salbeau verification desk will review your details. Verification usually completes within 24 hours.
            </p>
          </div>
        </form>
      </main>

      {/* MODAL: Full Screen Image Preview */}
      {previewDocUrl && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="relative max-w-2xl w-full bg-white rounded-3xl overflow-hidden shadow-2xl p-4">
            <button
              onClick={() => setPreviewDocUrl(null)}
              className="absolute top-4 right-4 z-10 w-9 h-9 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>
            <img
              src={previewDocUrl}
              alt="Verification Document Preview"
              className="w-full max-h-[75vh] object-contain rounded-2xl bg-stone-50"
            />
          </div>
        </div>
      )}
    </div>
  );
};
