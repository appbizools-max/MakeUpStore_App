import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../../context/AppContext';
import {
  ROLE_SHORT_TITLES,
  B2B_EXPERIENCE_OPTIONS,
  DEFAULT_SPECIALIZATIONS_MASTER,
  fetchSpecializationsMaster,
  suggestSpecialization
} from '../../utils/b2bVerificationService';
import { supabase } from '../../config/supabase';

export const B2BRegistrationForm = () => {
  const { userRole, userProfile, setUserProfile, setCurrentScreen, prefetchUserProfile, saveUserProfile } = useApp();

  const roleTitle = ROLE_SHORT_TITLES[userRole] || 'Business Partner';

  // Form State initialized from userProfile if returning back
  const [businessName, setBusinessName] = useState(userProfile?.businessName || '');
  const [ownerName, setOwnerName] = useState(userProfile?.name || '');
  const [mobileNumber, setMobileNumber] = useState(
    (userProfile?.phone || '').replace('+91', '').trim()
  );
  const [email, setEmail] = useState(userProfile?.email || '');

  // Dynamic Specializations Master & Multi-select State
  const [availableSpecs, setAvailableSpecs] = useState([]);
  const [selectedSpecs, setSelectedSpecs] = useState(() => {
    if (Array.isArray(userProfile?.specializations) && userProfile.specializations.length > 0) {
      return userProfile.specializations;
    }
    if (userProfile?.businessType) {
      return userProfile.businessType.split(',').map(s => s.trim()).filter(Boolean);
    }
    return [];
  });

  // Search filter for specializations
  const [specSearch, setSpecSearch] = useState('');

  // "Other" / Custom Specialization Input State
  const [showOtherInput, setShowOtherInput] = useState(false);
  const [customSpecName, setCustomSpecName] = useState('');
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [suggestNotice, setSuggestNotice] = useState({ text: '', type: 'info' });

  // Load Specializations Master from Store Database on Mount
  useEffect(() => {
    let isMounted = true;
    fetchSpecializationsMaster(supabase).then(list => {
      if (!isMounted) return;
      if (Array.isArray(list) && list.length > 0) {
        const roleFiltered = list.filter(s => s.role === userRole && s.isActive !== false);
        setAvailableSpecs(roleFiltered);
        if (selectedSpecs.length === 0 && roleFiltered.length > 0) {
          setSelectedSpecs([roleFiltered[0].name]);
        }
      }
    }).catch(() => {
      const defs = DEFAULT_SPECIALIZATIONS_MASTER.filter(s => s.role === userRole);
      if (isMounted) {
        setAvailableSpecs(defs);
        if (selectedSpecs.length === 0 && defs.length > 0) {
          setSelectedSpecs([defs[0].name]);
        }
      }
    });

    return () => { isMounted = false; };
  }, [userRole]);

  // Toggle selection for a specialization tag
  const toggleSpecialization = (specName) => {
    setSelectedSpecs(prev => {
      if (prev.includes(specName)) {
        if (prev.length <= 1) return prev; // Keep at least one selected
        return prev.filter(s => s !== specName);
      } else {
        return [...prev, specName];
      }
    });
  };

  // Remove a specialization tag
  const removeSpecialization = (specName) => {
    setSelectedSpecs(prev => {
      if (prev.length <= 1) return prev;
      return prev.filter(s => s !== specName);
    });
  };

  // Handle Suggesting / Adding "Other" Custom Specialization
  const handleAddCustomSpecialization = async () => {
    const clean = customSpecName.trim();
    if (!clean) return;

    // Duplicate check: already selected?
    if (selectedSpecs.some(s => s.toLowerCase() === clean.toLowerCase())) {
      setSuggestNotice({ text: `"${clean}" is already in your selected list.`, type: 'warning' });
      setTimeout(() => setSuggestNotice({ text: '', type: 'info' }), 3500);
      setCustomSpecName('');
      setShowOtherInput(false);
      return;
    }

    // Duplicate check: already in available specs?
    const existing = availableSpecs.find(s => s.name.toLowerCase() === clean.toLowerCase());
    if (existing) {
      setSelectedSpecs(prev => [...prev, existing.name]);
      setSuggestNotice({ text: `"${existing.name}" added to your specializations.`, type: 'success' });
      setTimeout(() => setSuggestNotice({ text: '', type: 'info' }), 3500);
      setCustomSpecName('');
      setShowOtherInput(false);
      return;
    }

    setIsSuggesting(true);
    try {
      const res = await suggestSpecialization(supabase, {
        name: clean,
        role: userRole,
        suggestedBy: ownerName.trim() || email.trim() || mobileNumber.trim() || 'B2B Partner'
      });

      const addedName = res.item?.name || clean;
      setAvailableSpecs(prev => [res.item, ...prev]);
      setSelectedSpecs(prev => [...prev, addedName]);
      setCustomSpecName('');
      setShowOtherInput(false);
      setSuggestNotice({
        text: `"${addedName}" suggested & added to your profile!`,
        type: 'success'
      });
      setTimeout(() => setSuggestNotice({ text: '', type: 'info' }), 4000);
    } catch (err) {
      setSuggestNotice({ text: err.message || 'Could not suggest specialization.', type: 'error' });
      setTimeout(() => setSuggestNotice({ text: '', type: 'info' }), 3500);
    } finally {
      setIsSuggesting(false);
    }
  };

  // Experience Options (Standardized)
  const [experience, setExperience] = useState(userProfile?.experience || '1–3 Years');

  // Address State
  const [address, setAddress] = useState(userProfile?.address || '');
  const [pincode, setPincode] = useState(userProfile?.pincode || '');
  const [city, setCity] = useState(userProfile?.city || '');
  const [state, setState] = useState(userProfile?.state || '');
  const [isDetectingPin, setIsDetectingPin] = useState(false);
  const [pinError, setPinError] = useState('');

  // GSTIN (Optional)
  const [gstin, setGstin] = useState(userProfile?.gstNumber || '');

  // Touched state for validation feedback
  const [touched, setTouched] = useState({});

  // Auto-detect City and State on valid 6-digit Pincode
  useEffect(() => {
    const cleanPin = pincode.replace(/\D/g, '');
    if (cleanPin.length === 6) {
      lookupPincode(cleanPin);
    } else {
      setPinError('');
    }
  }, [pincode]);

  const pincodeCache = useRef(new Map());

  const lookupPincode = async (code) => {
    if (pincodeCache.current.has(code)) {
      const cached = pincodeCache.current.get(code);
      setCity(cached.city);
      setState(cached.state);
      setPinError('');
      return;
    }

    setIsDetectingPin(true);
    setPinError('');
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);
      const res = await fetch(`https://api.postalpincode.in/pincode/${code}`, {
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      const data = await res.json();
      if (data && Array.isArray(data) && data[0]?.Status === 'Success' && data[0].PostOffice?.length > 0) {
        const po = data[0].PostOffice[0];
        const detectedCity = po.District || po.Block || po.Division || po.Name || '';
        const detectedState = po.State || '';
        pincodeCache.current.set(code, { city: detectedCity, state: detectedState });
        setCity(detectedCity);
        setState(detectedState);
        setPinError('');
      } else {
        setPinError('Location not auto-detected. Please enter City & State manually.');
      }
    } catch (_) {
      // Allow manual input gracefully
    } finally {
      setIsDetectingPin(false);
    }
  };

  const handlePhoneChange = (text) => {
    const raw = text.replace(/\D/g, '').slice(0, 10);
    if (raw.length > 5) {
      setMobileNumber(`${raw.slice(0, 5)} ${raw.slice(5)}`);
    } else {
      setMobileNumber(raw);
    }
  };

  // Validation
  const cleanPhone = mobileNumber.replace(/\D/g, '');
  const cleanPin = pincode.replace(/\D/g, '');
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const isEmailValid = !email.trim() || emailRegex.test(email.trim());

  const isFormValid =
    selectedSpecs.length > 0 &&
    businessName.trim().length >= 2 &&
    ownerName.trim().length >= 2 &&
    cleanPhone.length === 10 &&
    address.trim().length >= 3 &&
    cleanPin.length === 6 &&
    city.trim().length >= 2 &&
    state.trim().length >= 2 &&
    isEmailValid;

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleProceed = async () => {
    setTouched({
      businessName: true,
      ownerName: true,
      mobileNumber: true,
      address: true,
      pincode: true,
      city: true,
      state: true,
      email: true
    });

    if (!isFormValid || isSubmitting) return;
    setIsSubmitting(true);

    try {
      const fullPhone = `+91 ${cleanPhone.slice(0, 5)} ${cleanPhone.slice(5)}`;

      if (saveUserProfile) {
        await saveUserProfile({
          fullName: ownerName.trim(),
          name: ownerName.trim(),
          ownerName: ownerName.trim(),
          phone: fullPhone,
          email: email.trim(),
          businessName: businessName.trim(),
          business_name: businessName.trim(),
          businessType: selectedSpecs.join(', '),
          specializations: selectedSpecs,
          experience,
          address: address.trim(),
          pincode: cleanPin,
          city: city.trim(),
          state: state.trim(),
          gstNumber: gstin.trim().toUpperCase(),
          role: userRole,
          isB2BProfileFilled: true,
        });
      } else {
        setUserProfile(prev => ({
          ...prev,
          name: ownerName.trim(),
          phone: fullPhone,
          email: email.trim(),
          businessName: businessName.trim(),
          businessType: selectedSpecs.join(', '),
          specializations: selectedSpecs,
          experience,
          address: address.trim(),
          pincode: cleanPin,
          city: city.trim(),
          state: state.trim(),
          gstNumber: gstin.trim().toUpperCase(),
          role: userRole,
          isB2BProfileFilled: true
        }));
      }

      setCurrentScreen('b2b_verification');
    } catch (err) {
      console.warn('Error saving B2B profile:', err);
      setCurrentScreen('b2b_verification');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      className="flex-1 bg-white"
    >
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Top Header */}
      <View className="px-5 pt-3 pb-3 border-b border-[#FCE4EC] bg-white flex-row items-center justify-between">
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => setCurrentScreen('onboarding')}
          className="w-10 h-10 rounded-full bg-white border border-[#FCE4EC] items-center justify-center shadow-2xs"
        >
          <Ionicons name="arrow-back" size={20} color="#C2477A" />
        </TouchableOpacity>

        <View className="bg-white border border-[#F5A8C0] px-3.5 py-1.5 rounded-full flex-row items-center gap-1.5">
          <Ionicons name="shield-checkmark" size={14} color="#C2477A" />
          <Text className="text-xs font-black text-[#C2477A]">
            {roleTitle} Partner
          </Text>
        </View>

        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: 20, paddingBottom: 60 }}
      >
        {/* Title & Value Proposition */}
        <View className="mb-6">
          <Text className="text-2xl font-black text-[#3A2430] mb-1.5">
            Business Registration
          </Text>
          <Text className="text-xs font-medium text-[#8C7078] leading-relaxed">
            Register your {roleTitle.toLowerCase()} business to unlock exclusive wholesale trade pricing, bulk discounts & GST tax invoices.
          </Text>
        </View>

        {/* ── SECTION 1: BUSINESS IDENTITY ─────────────────────────── */}
        <View className="mb-5 bg-white p-4 rounded-2xl border border-stone-200 shadow-2xs">
          <View className="flex-row items-center gap-2 mb-3">
            <Ionicons name="storefront-outline" size={16} color="#C2477A" />
            <Text className="text-xs font-black text-[#C2477A] uppercase tracking-wider">
              1. Business Identity
            </Text>
          </View>

          {/* Business / Salon Name */}
          <View className="mb-3">
            <Text className="text-xs font-bold text-[#553846] mb-1.5 ml-1">
              {userRole === 'salon' ? 'Salon / Business Name *' : 'Studio / Professional Brand Name *'}
            </Text>
            <TextInput
              value={businessName}
              onChangeText={setBusinessName}
              onBlur={() => setTouched(t => ({ ...t, businessName: true }))}
              placeholder={userRole === 'salon' ? 'e.g. Luxe Hair & Beauty Salon' : 'e.g. Priya Sharma Bridal Studio'}
              placeholderTextColor="#A8929A"
              className={`bg-white border rounded-xl px-3.5 py-3 text-sm text-[#3A2430] font-semibold ${
                touched.businessName && businessName.trim().length < 2 ? 'border-red-400 bg-red-50/20' : 'border-stone-300'
              }`}
            />
            {touched.businessName && businessName.trim().length < 2 && (
              <Text className="text-[10px] text-red-500 font-bold ml-1 mt-1">Please enter your business or studio name</Text>
            )}
          </View>

          {/* Owner / Contact Person Name */}
          <View>
            <Text className="text-xs font-bold text-[#553846] mb-1.5 ml-1">
              Owner / Authorized Contact Person *
            </Text>
            <TextInput
              value={ownerName}
              onChangeText={setOwnerName}
              onBlur={() => setTouched(t => ({ ...t, ownerName: true }))}
              placeholder="e.g. Ananya Sharma"
              placeholderTextColor="#A8929A"
              className={`bg-white border rounded-xl px-3.5 py-3 text-sm text-[#3A2430] font-semibold ${
                touched.ownerName && ownerName.trim().length < 2 ? 'border-red-400 bg-red-50/20' : 'border-stone-300'
              }`}
            />
            {touched.ownerName && ownerName.trim().length < 2 && (
              <Text className="text-[10px] text-red-500 font-bold ml-1 mt-1">Please enter full contact name</Text>
            )}
          </View>
        </View>

        {/* ── SECTION 2: DIRECT MOBILE & CREDENTIALS ───────────────── */}
        <View className="mb-5 bg-white p-4 rounded-2xl border border-stone-200 shadow-2xs">
          <View className="flex-row items-center gap-2 mb-3">
            <Ionicons name="call-outline" size={16} color="#C2477A" />
            <Text className="text-xs font-black text-[#C2477A] uppercase tracking-wider">
              2. Mobile Verification & Contact
            </Text>
          </View>

          {/* Business Mobile Number */}
          <View className="mb-3">
            <Text className="text-xs font-bold text-[#553846] mb-1.5 ml-1">
              Business Mobile Number *
            </Text>
            <View
              className={`border bg-white rounded-xl py-3 px-3.5 flex-row items-center ${
                touched.mobileNumber && cleanPhone.length !== 10 ? 'border-red-400 bg-red-50/20' : 'border-stone-300'
              }`}
            >
              {/* Indian Flag Badge */}
              <View className="w-5 h-3.5 bg-[#FF9933] rounded-xs mr-2 overflow-hidden justify-between border border-[#E8DDD7]">
                <View className="h-1 bg-[#FF9933]" />
                <View className="h-1 bg-white items-center justify-center">
                  <View className="w-0.5 h-0.5 rounded-full bg-[#000080]" />
                </View>
                <View className="h-1 bg-[#138808]" />
              </View>

              <Text className="text-sm font-black text-[#3A2430] mr-2">+91</Text>
              <Text className="text-xs text-stone-300 mr-2.5">|</Text>

              <TextInput
                value={mobileNumber}
                onChangeText={handlePhoneChange}
                onBlur={() => setTouched(t => ({ ...t, mobileNumber: true }))}
                keyboardType="phone-pad"
                maxLength={11}
                editable={!userProfile?.isPhoneVerified}
                className="flex-1 text-sm font-bold text-[#3A2430] p-0"
                placeholder="10-digit mobile number"
                placeholderTextColor="#A8929A"
              />
              {userProfile?.isPhoneVerified && (
                <View className="flex-row items-center bg-[#DCFCE7] px-2.5 py-1 rounded-full">
                  <Ionicons name="checkmark-circle" size={13} color="#16A34A" />
                  <Text className="text-[10px] font-bold text-[#166534] ml-1">Verified</Text>
                </View>
              )}
            </View>
            {userProfile?.isPhoneVerified ? (
              <Text className="text-[11px] text-[#166534] font-medium ml-1 mt-1.5">
                ✓ Verified via OTP. This number will be linked to your business account.
              </Text>
            ) : (
              <Text className="text-[11px] text-[#8C7078] font-medium ml-1 mt-1.5">
                Your registered business mobile number.
              </Text>
            )}
            {touched.mobileNumber && cleanPhone.length !== 10 && (
              <Text className="text-[10px] text-red-500 font-bold ml-1 mt-1">Please enter a valid 10-digit mobile number</Text>
            )}
          </View>

          {/* Business Email Address */}
          <View>
            <Text className="text-xs font-bold text-[#553846] mb-1.5 ml-1">
              Business Email Address (Optional)
            </Text>
            <TextInput
              value={email}
              onChangeText={setEmail}
              onBlur={() => setTouched(t => ({ ...t, email: true }))}
              keyboardType="email-address"
              autoCapitalize="none"
              placeholder="e.g. contact@luxestudio.com"
              placeholderTextColor="#A8929A"
              className={`bg-white border rounded-xl px-3.5 py-3 text-sm text-[#3A2430] font-semibold ${
                touched.email && !isEmailValid ? 'border-red-400 bg-red-50/20' : 'border-stone-300'
              }`}
            />
            {touched.email && !isEmailValid && (
              <Text className="text-[10px] text-red-500 font-bold ml-1 mt-1">Please enter a valid email address</Text>
            )}
          </View>
        </View>

        {/* ── SECTION 3: SPECIALIZATION & EXPERIENCE ───────────────── */}
        <View className="mb-5 bg-white p-4 rounded-2xl border border-stone-200 shadow-2xs">
          <View className="flex-row items-center justify-between mb-3">
            <View className="flex-row items-center gap-2">
              <Ionicons name="sparkles-outline" size={16} color="#C2477A" />
              <Text className="text-xs font-black text-[#C2477A] uppercase tracking-wider">
                3. Specialization & Experience
              </Text>
            </View>
            <View className="bg-pink-50 px-2 py-0.5 rounded-full border border-pink-100">
              <Text className="text-[10px] font-bold text-[#C2477A]">
                {selectedSpecs.length} Selected
              </Text>
            </View>
          </View>

          {/* Notice Banner */}
          {suggestNotice.text ? (
            <View className={`mb-3 p-2.5 rounded-xl border flex-row items-center gap-2 ${
              suggestNotice.type === 'success' ? 'bg-emerald-50 border-emerald-200' :
              suggestNotice.type === 'warning' ? 'bg-amber-50 border-amber-200' :
              suggestNotice.type === 'error' ? 'bg-red-50 border-red-200' :
              'bg-blue-50 border-blue-200'
            }`}>
              <Ionicons
                name={suggestNotice.type === 'success' ? 'checkmark-circle' : 'alert-circle'}
                size={16}
                color={suggestNotice.type === 'success' ? '#059669' : '#C2477A'}
              />
              <Text className="text-xs font-bold text-[#3A2430] flex-1">
                {suggestNotice.text}
              </Text>
            </View>
          ) : null}

          {/* Active Selected Tags (Removable) */}
          <View className="mb-3">
            <Text className="text-xs font-bold text-[#553846] mb-1.5 ml-1">
              Active Specializations * <Text className="text-[11px] font-normal text-stone-500">(Tap × to remove)</Text>
            </Text>
            <View className="flex-row flex-wrap gap-1.5 min-h-[36px] p-2 bg-[#FFF9FA] border border-[#FCE4EC] rounded-xl">
              {selectedSpecs.map(specName => (
                <View
                  key={specName}
                  className="flex-row items-center gap-1.5 bg-white border border-[#C2477A] px-2.5 py-1 rounded-full shadow-2xs"
                >
                  <Text className="text-xs font-bold text-[#C2477A]">
                    {specName}
                  </Text>
                  <TouchableOpacity
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    onPress={() => removeSpecialization(specName)}
                  >
                    <Ionicons name="close-circle" size={15} color="#C2477A" />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          </View>

          {/* Search Filter Bar */}
          <View className="mb-3">
            <View className="flex-row items-center bg-stone-50 border border-stone-200 rounded-xl px-3 py-1.5">
              <Ionicons name="search" size={15} color="#A8929A" />
              <TextInput
                value={specSearch}
                onChangeText={setSpecSearch}
                placeholder="Search specializations..."
                placeholderTextColor="#A8929A"
                className="flex-1 ml-2 text-xs font-semibold text-[#3A2430] py-1"
              />
              {specSearch.length > 0 && (
                <TouchableOpacity onPress={() => setSpecSearch('')} hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}>
                  <Ionicons name="close-circle" size={16} color="#A8929A" />
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Available Specialization Pills */}
          <View className="mb-4">
            <Text className="text-[11px] font-bold text-stone-500 mb-2 ml-1">
              Select all that apply to your business:
            </Text>
            <View className="flex-row flex-wrap gap-2">
              {availableSpecs
                .filter(s => !specSearch || (s.name || '').toLowerCase().includes(specSearch.toLowerCase()))
                .map(spec => {
                  const isSelected = selectedSpecs.includes(spec.name);
                  return (
                    <TouchableOpacity
                      key={spec.id || spec.name}
                      activeOpacity={0.8}
                      onPress={() => toggleSpecialization(spec.name)}
                      className={`flex-row items-center gap-1.5 px-3 py-1.5 rounded-full border ${
                        isSelected
                          ? 'bg-[#FFF0F5] border-[#C2477A]'
                          : 'bg-white border-stone-200'
                      }`}
                    >
                      <Ionicons
                        name={isSelected ? 'checkmark-circle' : 'add-outline'}
                        size={14}
                        color={isSelected ? '#C2477A' : '#705060'}
                      />
                      <Text
                        className={`text-xs font-bold ${
                          isSelected ? 'text-[#C2477A]' : 'text-stone-700'
                        }`}
                      >
                        {spec.name}
                      </Text>
                    </TouchableOpacity>
                  );
                })}

              {/* + Other / Custom Pill */}
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => setShowOtherInput(prev => !prev)}
                className={`flex-row items-center gap-1.5 px-3 py-1.5 rounded-full border border-dashed ${
                  showOtherInput
                    ? 'bg-[#C2477A] border-[#C2477A]'
                    : 'bg-stone-50 border-stone-400'
                }`}
              >
                <Ionicons
                  name={showOtherInput ? 'close-outline' : 'add-circle-outline'}
                  size={14}
                  color={showOtherInput ? '#FFFFFF' : '#C2477A'}
                />
                <Text
                  className={`text-xs font-bold ${
                    showOtherInput ? 'text-white' : 'text-[#C2477A]'
                  }`}
                >
                  + Other / Custom
                </Text>
              </TouchableOpacity>
            </View>

            {/* Custom Specialization Input (Expanding Form) */}
            {showOtherInput && (
              <View className="mt-3 p-3 bg-[#FFF9FA] border border-[#FCE4EC] rounded-xl">
                <Text className="text-xs font-bold text-[#553846]">
                  Suggest & Add Custom Specialization
                </Text>
                <Text className="text-[11px] text-stone-500 mt-0.5">
                  Type your custom specialization below. It will be added to your profile and submitted for admin approval.
                </Text>
                <View className="flex-row items-center gap-2 mt-2">
                  <TextInput
                    value={customSpecName}
                    onChangeText={setCustomSpecName}
                    placeholder="e.g. Bridal Nail Extensions, HD Airbrush..."
                    placeholderTextColor="#A8929A"
                    className="flex-1 bg-white border border-stone-300 rounded-xl px-3 py-2 text-xs font-semibold text-[#3A2430]"
                  />
                  <TouchableOpacity
                    disabled={isSuggesting || !customSpecName.trim()}
                    onPress={handleAddCustomSpecialization}
                    className={`px-3.5 py-2.5 rounded-xl flex-row items-center gap-1.5 ${
                      !customSpecName.trim() || isSuggesting
                        ? 'bg-stone-300'
                        : 'bg-[#C2477A] active:bg-[#9E2D5B]'
                    }`}
                  >
                    {isSuggesting ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <>
                        <Ionicons name="add" size={16} color="#FFFFFF" />
                        <Text className="text-xs font-black text-white">Add</Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>

          {/* Experience Options */}
          <View>
            <Text className="text-xs font-bold text-[#553846] mb-2 ml-1">
              Years of Experience / Industry Track Record *
            </Text>
            <View className="flex-row flex-wrap gap-2">
              {B2B_EXPERIENCE_OPTIONS.map(exp => {
                const isSelected = experience === exp;
                return (
                  <TouchableOpacity
                    key={exp}
                    activeOpacity={0.8}
                    onPress={() => setExperience(exp)}
                    className={`px-3 py-2 rounded-full border ${
                      isSelected
                        ? 'bg-white border-[#C2477A]'
                        : 'bg-white border-stone-200'
                    }`}
                  >
                    <Text
                      className={`text-xs font-bold ${
                        isSelected ? 'text-[#C2477A]' : 'text-stone-600'
                      }`}
                    >
                      {exp}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </View>

        {/* ── SECTION 4: PREMISES & BUSINESS ADDRESS ────────────────── */}
        <View className="mb-5 bg-white p-4 rounded-2xl border border-stone-200 shadow-2xs">
          <View className="flex-row items-center gap-2 mb-3">
            <Ionicons name="location-outline" size={16} color="#C2477A" />
            <Text className="text-xs font-black text-[#C2477A] uppercase tracking-wider">
              4. Commercial Premises Address
            </Text>
          </View>

          {/* Street Address */}
          <View className="mb-3">
            <Text className="text-xs font-bold text-[#553846] mb-1.5 ml-1">
              Shop / Studio / Commercial Address *
            </Text>
            <TextInput
              value={address}
              onChangeText={setAddress}
              onBlur={() => setTouched(t => ({ ...t, address: true }))}
              placeholder="e.g. Shop #12, 2nd Floor, Phoenix Mall Road"
              placeholderTextColor="#A8929A"
              className={`bg-white border rounded-xl px-3.5 py-3 text-sm text-[#3A2430] font-semibold ${
                touched.address && address.trim().length < 3 ? 'border-red-400 bg-red-50/20' : 'border-stone-300'
              }`}
            />
            {touched.address && address.trim().length < 3 && (
              <Text className="text-[10px] text-red-500 font-bold ml-1 mt-1">Please enter business premise address</Text>
            )}
          </View>

          {/* Postal PIN Code */}
          <View className="mb-3">
            <View className="flex-row items-center justify-between mb-1.5 ml-1">
              <Text className="text-xs font-bold text-[#553846]">
                Postal PIN Code *
              </Text>
              {isDetectingPin && (
                <View className="flex-row items-center gap-1">
                  <ActivityIndicator size="small" color="#C2477A" />
                  <Text className="text-[10px] font-bold text-[#C2477A]">Detecting City & State...</Text>
                </View>
              )}
            </View>
            <TextInput
              value={pincode}
              onChangeText={setPincode}
              onBlur={() => setTouched(t => ({ ...t, pincode: true }))}
              keyboardType="number-pad"
              maxLength={6}
              placeholder="6-digit PIN code"
              placeholderTextColor="#A8929A"
              className={`bg-white border rounded-xl px-3.5 py-3 text-sm text-[#3A2430] font-semibold ${
                touched.pincode && cleanPin.length !== 6 ? 'border-red-400 bg-red-50/20' : 'border-stone-300'
              }`}
            />
            {pinError ? (
              <Text className="text-[10px] text-amber-600 font-bold ml-1 mt-1">{pinError}</Text>
            ) : null}
            {touched.pincode && cleanPin.length !== 6 && (
              <Text className="text-[10px] text-red-500 font-bold ml-1 mt-1">Please enter valid 6-digit PIN code</Text>
            )}
          </View>

          {/* City & State (Auto-populated or editable) */}
          <View className="flex-row gap-3">
            <View className="flex-1">
              <Text className="text-xs font-bold text-[#553846] mb-1.5 ml-1">
                City *
              </Text>
              <TextInput
                value={city}
                onChangeText={setCity}
                onBlur={() => setTouched(t => ({ ...t, city: true }))}
                placeholder="City"
                placeholderTextColor="#A8929A"
                className={`bg-white border rounded-xl px-3.5 py-3 text-sm text-[#3A2430] font-semibold ${
                  touched.city && city.trim().length < 2 ? 'border-red-400 bg-red-50/20' : 'border-stone-300'
                }`}
              />
            </View>
            <View className="flex-1">
              <Text className="text-xs font-bold text-[#553846] mb-1.5 ml-1">
                State *
              </Text>
              <TextInput
                value={state}
                onChangeText={setState}
                onBlur={() => setTouched(t => ({ ...t, state: true }))}
                placeholder="State"
                placeholderTextColor="#A8929A"
                className={`bg-white border rounded-xl px-3.5 py-3 text-sm text-[#3A2430] font-semibold ${
                  touched.state && state.trim().length < 2 ? 'border-red-400 bg-red-50/20' : 'border-stone-300'
                }`}
              />
            </View>
          </View>
        </View>

        {/* ── SECTION 5: TAX & GSTIN (OPTIONAL) ─────────────────────── */}
        <View className="mb-6 bg-white p-4 rounded-2xl border border-stone-200 shadow-2xs">
          <View className="flex-row items-center gap-2 mb-3">
            <Ionicons name="receipt-outline" size={16} color="#C2477A" />
            <Text className="text-xs font-black text-[#C2477A] uppercase tracking-wider">
              5. Tax & Business Registration (Optional)
            </Text>
          </View>

          <View>
            <Text className="text-xs font-bold text-[#553846] mb-1.5 ml-1">
              GSTIN / Trade Registration No. (Optional)
            </Text>
            <TextInput
              value={gstin}
              onChangeText={setGstin}
              autoCapitalize="characters"
              maxLength={15}
              placeholder="e.g. 29ABCDE1234F1Z5"
              placeholderTextColor="#A8929A"
              className="bg-white border border-stone-300 rounded-xl px-3.5 py-3 text-sm text-[#3A2430] font-semibold tracking-wide"
            />
            <Text className="text-[11px] text-[#8C7078] font-medium ml-1 mt-1.5">
              Enter GSTIN if you require business tax invoices for input tax credit. You can also add this later.
            </Text>
          </View>
        </View>

        {/* Action Button: Complete Registration */}
        <TouchableOpacity
          activeOpacity={0.9}
          disabled={!isFormValid || isSubmitting}
          onPress={handleProceed}
          style={{ backgroundColor: isFormValid ? '#C2477A' : '#E5E7EB' }}
          className="w-full py-4 rounded-full items-center justify-center shadow-lg active:opacity-90 mb-4 flex-row gap-2"
        >
          {isSubmitting ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <>
              <Text
                style={{ color: isFormValid ? '#FFFFFF' : '#9CA3AF' }}
                className="font-black text-base tracking-wide"
              >
                Complete Registration & Continue
              </Text>
              <Ionicons
                name="arrow-forward"
                size={18}
                color={isFormValid ? '#FFFFFF' : '#9CA3AF'}
              />
            </>
          )}
        </TouchableOpacity>

        {/* Legal Terms Notice */}
        <View className="items-center mb-2">
          <Text className="text-xs text-[#8C7078] text-center leading-relaxed">
            By proceeding, you agree to Salbeau's{' '}
            <Text className="text-[#C2477A] font-bold underline">Partner Terms</Text> &{' '}
            <Text className="text-[#C2477A] font-bold underline">Wholesale Policy</Text>
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

