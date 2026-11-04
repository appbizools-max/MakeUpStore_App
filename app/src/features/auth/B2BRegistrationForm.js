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
import { ROLE_SHORT_TITLES } from '../../utils/b2bVerificationService';

export const B2BRegistrationForm = () => {
  const { userRole, userProfile, setUserProfile, setCurrentScreen, prefetchUserProfile } = useApp();

  const roleTitle = ROLE_SHORT_TITLES[userRole] || 'Business Partner';

  // Form State initialized from userProfile if returning back
  const [businessName, setBusinessName] = useState(userProfile?.businessName || '');
  const [ownerName, setOwnerName] = useState(userProfile?.name || '');
  const [mobileNumber, setMobileNumber] = useState(
    (userProfile?.phone || '').replace('+91', '').trim()
  );
  const [email, setEmail] = useState(userProfile?.email || '');

  // Role-specific Specializations
  const SPECIALIZATIONS_BY_ROLE = {
    salon: [
      'Unisex Salon',
      'Women Salon',
      "Men's Salon",
      'Spa & Wellness',
      'Hair Studio',
      'Bridal Studio'
    ],
    artist: [
      'Bridal Makeup',
      'Fashion & Editorial',
      'Freelance Artist',
      'Celebrity & TV',
      'Makeup Academy',
      'Party & Events'
    ],
    beautician: [
      'Skin Care & Facial',
      'Hair Styling & Color',
      'Nail & Lash Art',
      'Aesthetic & Laser',
      'Freelance Beauty',
      'Spa Therapist'
    ]
  };

  const roleSpecs = SPECIALIZATIONS_BY_ROLE[userRole] || SPECIALIZATIONS_BY_ROLE.salon;
  const [businessType, setBusinessType] = useState(userProfile?.businessType || roleSpecs[0]);

  // Experience Options
  const EXPERIENCE_OPTIONS = [
    '< 1 Year',
    '1–3 Years',
    '3–5 Years',
    '5–10 Years',
    '10+ Years'
  ];
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
    businessName.trim().length >= 2 &&
    ownerName.trim().length >= 2 &&
    cleanPhone.length === 10 &&
    address.trim().length >= 3 &&
    cleanPin.length === 6 &&
    city.trim().length >= 2 &&
    state.trim().length >= 2 &&
    isEmailValid;

  const handleProceed = () => {
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

    if (!isFormValid) return;

    const fullPhone = `+91 ${cleanPhone.slice(0, 5)} ${cleanPhone.slice(5)}`;

    setUserProfile(prev => ({
      ...prev,
      name: ownerName.trim(),
      phone: fullPhone,
      email: email.trim(),
      businessName: businessName.trim(),
      businessType,
      experience,
      address: address.trim(),
      pincode: cleanPin,
      city: city.trim(),
      state: state.trim(),
      gstNumber: gstin.trim().toUpperCase(),
      role: userRole,
      isB2BProfileFilled: true
    }));

    if (prefetchUserProfile) {
      prefetchUserProfile(fullPhone);
    }

    setCurrentScreen('otp');
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

        <View className="bg-[#FFF5F8] border border-[#F5A8C0] px-3.5 py-1.5 rounded-full flex-row items-center gap-1.5">
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
                className="flex-1 text-sm font-bold text-[#3A2430] p-0"
                placeholder="10-digit mobile number"
                placeholderTextColor="#A8929A"
              />
            </View>
            <Text className="text-[11px] text-[#8C7078] font-medium ml-1 mt-1.5">
              A 4-digit verification code will be sent to this mobile number on the next step.
            </Text>
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
          <View className="flex-row items-center gap-2 mb-3">
            <Ionicons name="sparkles-outline" size={16} color="#C2477A" />
            <Text className="text-xs font-black text-[#C2477A] uppercase tracking-wider">
              3. Specialization & Experience
            </Text>
          </View>

          {/* Specialization Pills */}
          <View className="mb-4">
            <Text className="text-xs font-bold text-[#553846] mb-2 ml-1">
              Category Specialization *
            </Text>
            <View className="flex-row flex-wrap gap-2">
              {roleSpecs.map(spec => {
                const isSelected = businessType === spec;
                return (
                  <TouchableOpacity
                    key={spec}
                    activeOpacity={0.8}
                    onPress={() => setBusinessType(spec)}
                    className={`px-3 py-2 rounded-full border ${
                      isSelected
                        ? 'bg-[#FFF0F5] border-[#C2477A]'
                        : 'bg-white border-stone-200'
                    }`}
                  >
                    <Text
                      className={`text-xs font-bold ${
                        isSelected ? 'text-[#C2477A]' : 'text-stone-600'
                      }`}
                    >
                      {spec}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Experience Pills */}
          <View>
            <Text className="text-xs font-bold text-[#553846] mb-2 ml-1">
              Years in Business / Industry *
            </Text>
            <View className="flex-row flex-wrap gap-2">
              {EXPERIENCE_OPTIONS.map(exp => {
                const isSelected = experience === exp;
                return (
                  <TouchableOpacity
                    key={exp}
                    activeOpacity={0.8}
                    onPress={() => setExperience(exp)}
                    className={`px-3 py-2 rounded-full border ${
                      isSelected
                        ? 'bg-[#FFF0F5] border-[#C2477A]'
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

        {/* Action Button: Proceed to OTP Verification */}
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={handleProceed}
          style={{ backgroundColor: isFormValid ? '#C2477A' : '#E5E7EB' }}
          className="w-full py-4 rounded-full items-center justify-center shadow-lg active:opacity-90 mb-4 flex-row gap-2"
        >
          <Text
            style={{ color: isFormValid ? '#FFFFFF' : '#9CA3AF' }}
            className="font-black text-base tracking-wide"
          >
            Proceed to OTP Verification
          </Text>
          <Ionicons
            name="arrow-forward"
            size={18}
            color={isFormValid ? '#FFFFFF' : '#9CA3AF'}
          />
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

