import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  Modal
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFonts } from 'expo-font';
import { GreatVibes_400Regular } from '@expo-google-fonts/great-vibes';
import { useApp } from '../../context/AppContext';
import {
  ROLE_SHORT_TITLES,
  STANDARD_DOCUMENT_SLOTS
} from '../../utils/b2bVerificationService';
import { getSafeImageSource } from '../../utils/imageUtils';

export const B2BVerificationScreen = () => {
  const {
    userRole,
    userProfile,
    userVerificationRecord,
    submitUserB2BVerification,
    setCurrentScreen,
    setUserRole
  } = useApp();

  const [fontsLoaded] = useFonts({
    GreatVibes_400Regular,
  });

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

  // Document upload / preview modals
  const [activeUploadSlot, setActiveUploadSlot] = useState(null); // slot object
  const [uploadDocName, setUploadDocName] = useState('');
  const [uploadDocUrl, setUploadDocUrl] = useState('');
  const [previewDocUrl, setPreviewDocUrl] = useState(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState({});

  // Sync profile details if available
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

    if (typeof navigator !== 'undefined' && navigator.geolocation) {
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
          // Fallback location tag based on region
          const fallback = `17.7231° N, 83.3012° E (GPS)`;
          if (isProf) {
            setLocationCoords(fallback);
            setIsLocatingProf(false);
          } else {
            setBusinessLocationCoords(fallback);
            setIsLocatingBiz(false);
          }
        },
        { timeout: 5000, enableHighAccuracy: false }
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

  // Open modal for uploading / replacing document
  const openUploadModal = (slot) => {
    setActiveUploadSlot(slot);
    setUploadDocName(slot.label);
    setUploadDocUrl('');
  };

  const handleSaveUploadedDoc = () => {
    if (!activeUploadSlot) return;
    const finalUrl = uploadDocUrl.trim() || '';
    const finalName = uploadDocName.trim() || activeUploadSlot.label;

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
    setUploadDocName('');
    setUploadDocUrl('');
  };

  const handleRemoveDoc = (slotKey) => {
    setDocuments(prev => prev.filter(d => d.type !== slotKey));
  };

  // Validation — Documents are strictly OPTIONAL
  const validate = () => {
    const errors = {};
    if (!contactName.trim()) errors.contactName = 'Professional name is required';
    if (!mobile.trim()) errors.mobile = 'Mobile number is required';
    if (!address.trim()) errors.address = 'Professional street address is required';
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

  const handleSubmit = async () => {
    if (!validate()) {
      Alert.alert('Required Information Missing', 'Please fill in all required address and professional fields.');
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
        Alert.alert(
          'Submitted Successfully',
          'Your B2B Professional Verification application has been received. Our verification desk will review your details.',
          [
            {
              text: 'View Status Hub',
              onPress: () => setCurrentScreen('verification_status')
            },
            {
              text: 'Explore Catalog',
              onPress: () => setCurrentScreen('home')
            }
          ]
        );
      } else {
        throw new Error(res?.error || 'Failed to submit verification');
      }
    } catch (err) {
      Alert.alert('Submission Error', err.message || 'Could not submit verification request. Please check your network and try again.');
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
      <View className="px-5 pt-4 pb-3 border-b border-[#FCE4EC] bg-white flex-row items-center justify-between">
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => setCurrentScreen('home')}
          className="w-10 h-10 rounded-full bg-[#FFF0F5] items-center justify-center"
        >
          <Ionicons name="arrow-back" size={20} color="#C2477A" />
        </TouchableOpacity>

        <View className="items-center">
          <Text className="text-base font-black text-[#3A2430]">
            B2B Professional Verification
          </Text>
          <Text className="text-[11px] font-bold text-[#C2477A] tracking-wider uppercase">
            {ROLE_SHORT_TITLES[effectiveRole] || effectiveRole} Account
          </Text>
        </View>

        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => setCurrentScreen('home')}
          className="px-2.5 py-1.5 rounded-full bg-stone-100"
        >
          <Text className="text-[11px] font-bold text-stone-600">Skip to Home</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 20, paddingBottom: 60 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Brand Banner */}
        <View className="items-center mb-4">
          <Text
            style={{
              fontFamily: fontsLoaded ? 'GreatVibes_400Regular' : (Platform.OS === 'ios' ? 'Snell Roundhand' : 'serif'),
            }}
            className="text-[34px] text-[#C2477A] text-center"
          >
            Salbeau Professional
          </Text>
          <Text className="text-xs text-[#8C7078] text-center font-medium mt-0.5">
            Unlock exclusive wholesale pricing, bulk quantity tiers & priority support
          </Text>
        </View>

        {/* Approved banner */}
        {isApproved && (
          <View className="bg-emerald-50 border border-emerald-300 rounded-2xl p-4 mb-5 flex-row items-center justify-between">
            <View className="flex-row items-center gap-2.5 flex-1 mr-2">
              <Ionicons name="shield-checkmark" size={24} color="#059669" />
              <View className="flex-1">
                <Text className="text-xs font-black text-emerald-950">
                  Account Verified & Approved
                </Text>
                <Text className="text-[11px] text-emerald-800 font-medium">
                  Exclusive {ROLE_SHORT_TITLES[effectiveRole] || effectiveRole} wholesale pricing is active on your account.
                </Text>
              </View>
            </View>
            <TouchableOpacity
              onPress={() => setCurrentScreen('verification_status')}
              className="bg-emerald-600 px-3 py-1.5 rounded-full"
            >
              <Text className="text-white text-[10px] font-black uppercase">View Hub</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Pending / Under review banner */}
        {isPending && (
          <View className="bg-blue-50 border border-blue-300 rounded-2xl p-4 mb-5 flex-row items-center justify-between">
            <View className="flex-row items-center gap-2.5 flex-1 mr-2">
              <Ionicons name="hourglass-outline" size={24} color="#2563EB" />
              <View className="flex-1">
                <Text className="text-xs font-black text-blue-950">
                  Application Under Review
                </Text>
                <Text className="text-[11px] text-blue-800 font-medium">
                  Your verification details have been received and are pending Admin verification.
                </Text>
              </View>
            </View>
            <TouchableOpacity
              onPress={() => setCurrentScreen('verification_status')}
              className="bg-blue-600 px-3 py-1.5 rounded-full"
            >
              <Text className="text-white text-[10px] font-black uppercase">View Status</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Resubmission / Requested Documents banner */}
        {isResubmission && (
          <View className="bg-amber-50 border border-amber-300 rounded-2xl p-4 mb-5">
            <View className="flex-row items-center gap-2 mb-1">
              <Ionicons name="alert-circle" size={18} color="#D97706" />
              <Text className="text-xs font-black text-amber-900">
                Action Required: {requestedDocuments.length > 0 ? 'Admin Requested Verification Documents' : 'Verification Update Requested'}
              </Text>
            </View>
            <Text className="text-xs text-amber-800 leading-relaxed font-medium">
              {userProfile?.rejectionReason || userVerificationRecord?.rejection_reason || 'Please upload the requested verification documents and resubmit.'}
            </Text>
          </View>
        )}

        {/* ======================================================== */}
        {/* 1. PROFESSIONAL INFORMATION */}
        {/* ======================================================== */}
        <View className="mb-6 bg-white p-4 rounded-2xl border border-stone-200 shadow-2xs">
          <Text className="text-xs font-black text-[#C2477A] mb-3 uppercase tracking-wider flex-row items-center">
            Professional Information
          </Text>

          {/* Professional / Business Name */}
          <View className="mb-3">
            <Text className="text-xs font-bold text-[#553846] mb-1.5 ml-1">
              Professional / Business Name *
            </Text>
            <TextInput
              value={contactName}
              onChangeText={setContactName}
              placeholder="e.g. Ananya Sharma or Studio Glow"
              placeholderTextColor="#A8929A"
              className={`bg-white border rounded-xl px-3.5 py-2.5 text-xs text-[#3A2430] font-medium ${formErrors.contactName ? 'border-red-500' : 'border-stone-300'}`}
            />
            {formErrors.contactName && (
              <Text className="text-[10px] text-red-500 font-bold ml-1 mt-1">{formErrors.contactName}</Text>
            )}
          </View>

          {/* Professional Type Pill */}
          <View className="mb-3">
            <Text className="text-xs font-bold text-[#553846] mb-1.5 ml-1">
              Professional Type
            </Text>
            <View className="flex-row gap-2">
              {['salon', 'artist', 'beautician'].map(rKey => (
                <TouchableOpacity
                  key={rKey}
                  onPress={() => setUserRole(rKey)}
                  className={`px-3 py-1.5 rounded-full border ${effectiveRole === rKey ? 'bg-[#FFF0F5] border-[#C2477A]' : 'bg-stone-50 border-stone-200'}`}
                >
                  <Text className={`text-xs font-bold ${effectiveRole === rKey ? 'text-[#C2477A]' : 'text-stone-600'}`}>
                    {ROLE_SHORT_TITLES[rKey]}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Phone Number */}
          <View className="mb-3">
            <Text className="text-xs font-bold text-[#553846] mb-1.5 ml-1">
              Phone Number *
            </Text>
            <TextInput
              value={mobile}
              onChangeText={setMobile}
              keyboardType="phone-pad"
              placeholder="+91 98765 43210"
              placeholderTextColor="#A8929A"
              className={`bg-white border rounded-xl px-3.5 py-2.5 text-xs text-[#3A2430] font-medium ${formErrors.mobile ? 'border-red-500' : 'border-stone-300'}`}
            />
            {formErrors.mobile && (
              <Text className="text-[10px] text-red-500 font-bold ml-1 mt-1">{formErrors.mobile}</Text>
            )}
          </View>

          {/* Email */}
          <View className="mb-1">
            <Text className="text-xs font-bold text-[#553846] mb-1.5 ml-1">
              Email Address (Optional)
            </Text>
            <TextInput
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              placeholder="e.g. contact@salbeau.com"
              placeholderTextColor="#A8929A"
              className="bg-white border border-stone-300 rounded-xl px-3.5 py-2.5 text-xs text-[#3A2430] font-medium"
            />
          </View>
        </View>

        {/* ======================================================== */}
        {/* 2. PERSONAL / PROFESSIONAL ADDRESS */}
        {/* ======================================================== */}
        <View className="mb-6 bg-white p-4 rounded-2xl border border-stone-200 shadow-2xs">
          <View className="flex-row items-center justify-between mb-3">
            <Text className="text-xs font-black text-[#C2477A] uppercase tracking-wider">
              Professional Address
            </Text>

            {/* Use Current Location Button */}
            <TouchableOpacity
              onPress={() => handleUseCurrentLocation('professional')}
              disabled={isLocatingProf}
              className="bg-[#FFF0F5] border border-[#F8BBD0] px-3 py-1 rounded-full flex-row items-center gap-1.5 active:opacity-80"
            >
              {isLocatingProf ? (
                <ActivityIndicator size="small" color="#C2477A" />
              ) : (
                <Ionicons name="locate" size={13} color="#C2477A" />
              )}
              <Text className="text-[11px] font-bold text-[#C2477A]">
                {isLocatingProf ? 'Locating...' : 'Use Current Location'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Location / Map Coordinates Tag if available */}
          {locationCoords && (
            <View className="bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-xl mb-3 flex-row items-center justify-between">
              <View className="flex-row items-center gap-1.5 flex-1">
                <Ionicons name="map" size={14} color="#059669" />
                <Text className="text-[11px] font-bold text-emerald-900">
                  Location: {locationCoords}
                </Text>
              </View>
              <TouchableOpacity onPress={() => setLocationCoords(null)}>
                <Ionicons name="close-circle" size={14} color="#059669" />
              </TouchableOpacity>
            </View>
          )}

          {/* Street Address */}
          <View className="mb-3">
            <Text className="text-xs font-bold text-[#553846] mb-1.5 ml-1">
              Address (House / Flat No., Street, Area) *
            </Text>
            <TextInput
              value={address}
              onChangeText={setAddress}
              placeholder="e.g. #42, Main Road, Dwaraka Nagar"
              placeholderTextColor="#A8929A"
              multiline
              numberOfLines={2}
              className={`bg-white border rounded-xl px-3.5 py-2.5 text-xs text-[#3A2430] font-medium ${formErrors.address ? 'border-red-500' : 'border-stone-300'}`}
            />
            {formErrors.address && (
              <Text className="text-[10px] text-red-500 font-bold ml-1 mt-1">{formErrors.address}</Text>
            )}
          </View>

          {/* City & State */}
          <View className="flex-row gap-2.5 mb-3">
            <View className="flex-1">
              <Text className="text-xs font-bold text-[#553846] mb-1.5 ml-1">City *</Text>
              <TextInput
                value={city}
                onChangeText={setCity}
                placeholder="Visakhapatnam"
                placeholderTextColor="#A8929A"
                className={`bg-white border rounded-xl px-3.5 py-2.5 text-xs text-[#3A2430] font-medium ${formErrors.city ? 'border-red-500' : 'border-stone-300'}`}
              />
              {formErrors.city && (
                <Text className="text-[10px] text-red-500 font-bold ml-1 mt-1">{formErrors.city}</Text>
              )}
            </View>
            <View className="flex-1">
              <Text className="text-xs font-bold text-[#553846] mb-1.5 ml-1">State *</Text>
              <TextInput
                value={state}
                onChangeText={setState}
                placeholder="Andhra Pradesh"
                placeholderTextColor="#A8929A"
                className={`bg-white border rounded-xl px-3.5 py-2.5 text-xs text-[#3A2430] font-medium ${formErrors.state ? 'border-red-500' : 'border-stone-300'}`}
              />
              {formErrors.state && (
                <Text className="text-[10px] text-red-500 font-bold ml-1 mt-1">{formErrors.state}</Text>
              )}
            </View>
          </View>

          {/* Pincode & Country */}
          <View className="flex-row gap-2.5">
            <View className="flex-1">
              <Text className="text-xs font-bold text-[#553846] mb-1.5 ml-1">Pincode *</Text>
              <TextInput
                value={pincode}
                onChangeText={setPincode}
                keyboardType="numeric"
                maxLength={6}
                placeholder="530017"
                placeholderTextColor="#A8929A"
                className={`bg-white border rounded-xl px-3.5 py-2.5 text-xs text-[#3A2430] font-medium ${formErrors.pincode ? 'border-red-500' : 'border-stone-300'}`}
              />
              {formErrors.pincode && (
                <Text className="text-[10px] text-red-500 font-bold ml-1 mt-1">{formErrors.pincode}</Text>
              )}
            </View>
            <View className="flex-1">
              <Text className="text-xs font-bold text-[#553846] mb-1.5 ml-1">Country</Text>
              <TextInput
                value={country}
                onChangeText={setCountry}
                editable={false}
                className="bg-stone-100 border border-stone-300 rounded-xl px-3.5 py-2.5 text-xs text-stone-600 font-bold"
              />
            </View>
          </View>
        </View>

        {/* ======================================================== */}
        {/* 3. BUSINESS ADDRESS */}
        {/* ======================================================== */}
        <View className="mb-6 bg-white p-4 rounded-2xl border border-stone-200 shadow-2xs">
          <Text className="text-xs font-black text-[#C2477A] mb-3 uppercase tracking-wider">
            Business Address
          </Text>

          {/* Checkbox: Business address is same as professional/home address */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => setIsBusinessAddressSame(prev => !prev)}
            className="flex-row items-center gap-2.5 bg-stone-50 border border-stone-200 p-3 rounded-xl mb-3.5"
          >
            <View className={`w-5 h-5 rounded-md items-center justify-center border ${isBusinessAddressSame ? 'bg-[#C2477A] border-[#C2477A]' : 'bg-white border-stone-400'}`}>
              {isBusinessAddressSame && <Ionicons name="checkmark" size={14} color="#FFFFFF" />}
            </View>
            <Text className="text-xs font-bold text-[#3A2430] flex-1">
              Business address is same as professional address
            </Text>
          </TouchableOpacity>

          {isBusinessAddressSame ? (
            <View className="bg-emerald-50/70 border border-emerald-200 p-3 rounded-xl">
              <Text className="text-[11px] font-bold text-emerald-900">
                ✓ Using professional address for business:
              </Text>
              <Text className="text-xs text-emerald-800 mt-0.5">
                {address ? `${address}, ${city}, ${state} - ${pincode}` : 'Will sync from professional address'}
              </Text>
            </View>
          ) : (
            <View className="mt-1 space-y-3">
              {/* Separate Business Name */}
              <View>
                <Text className="text-xs font-bold text-[#553846] mb-1.5 ml-1">
                  Business / Salon Name *
                </Text>
                <TextInput
                  value={businessName}
                  onChangeText={setBusinessName}
                  placeholder="e.g. Elegance Salon & Spa"
                  placeholderTextColor="#A8929A"
                  className={`bg-white border rounded-xl px-3.5 py-2.5 text-xs text-[#3A2430] font-medium ${formErrors.businessName ? 'border-red-500' : 'border-stone-300'}`}
                />
                {formErrors.businessName && (
                  <Text className="text-[10px] text-red-500 font-bold ml-1 mt-1">{formErrors.businessName}</Text>
                )}
              </View>

              {/* Use Current Location for Business Address */}
              <View className="flex-row items-center justify-between mt-2">
                <Text className="text-[11px] font-bold text-stone-500">Business Premises Location</Text>
                <TouchableOpacity
                  onPress={() => handleUseCurrentLocation('business')}
                  disabled={isLocatingBiz}
                  className="bg-[#FFF0F5] border border-[#F8BBD0] px-3 py-1 rounded-full flex-row items-center gap-1.5"
                >
                  {isLocatingBiz ? (
                    <ActivityIndicator size="small" color="#C2477A" />
                  ) : (
                    <Ionicons name="locate" size={13} color="#C2477A" />
                  )}
                  <Text className="text-[11px] font-bold text-[#C2477A]">
                    {isLocatingBiz ? 'Locating...' : 'Use Current Location'}
                  </Text>
                </TouchableOpacity>
              </View>

              {businessLocationCoords && (
                <View className="bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-xl flex-row items-center justify-between">
                  <Text className="text-[11px] font-bold text-emerald-900">
                    📍 Location: {businessLocationCoords}
                  </Text>
                  <TouchableOpacity onPress={() => setBusinessLocationCoords(null)}>
                    <Ionicons name="close-circle" size={14} color="#059669" />
                  </TouchableOpacity>
                </View>
              )}

              {/* Business Street Address */}
              <View>
                <Text className="text-xs font-bold text-[#553846] mb-1.5 ml-1">
                  Business Address *
                </Text>
                <TextInput
                  value={businessAddress}
                  onChangeText={setBusinessAddress}
                  placeholder="e.g. Shop #12, Commercial Plaza"
                  placeholderTextColor="#A8929A"
                  multiline
                  numberOfLines={2}
                  className={`bg-white border rounded-xl px-3.5 py-2.5 text-xs text-[#3A2430] font-medium ${formErrors.businessAddress ? 'border-red-500' : 'border-stone-300'}`}
                />
                {formErrors.businessAddress && (
                  <Text className="text-[10px] text-red-500 font-bold ml-1 mt-1">{formErrors.businessAddress}</Text>
                )}
              </View>

              {/* City & State */}
              <View className="flex-row gap-2.5">
                <View className="flex-1">
                  <Text className="text-xs font-bold text-[#553846] mb-1.5 ml-1">City *</Text>
                  <TextInput
                    value={businessCity}
                    onChangeText={setBusinessCity}
                    placeholder="City"
                    placeholderTextColor="#A8929A"
                    className={`bg-white border rounded-xl px-3.5 py-2.5 text-xs text-[#3A2430] font-medium ${formErrors.businessCity ? 'border-red-500' : 'border-stone-300'}`}
                  />
                </View>
                <View className="flex-1">
                  <Text className="text-xs font-bold text-[#553846] mb-1.5 ml-1">State *</Text>
                  <TextInput
                    value={businessState}
                    onChangeText={setBusinessState}
                    placeholder="State"
                    placeholderTextColor="#A8929A"
                    className={`bg-white border rounded-xl px-3.5 py-2.5 text-xs text-[#3A2430] font-medium ${formErrors.businessState ? 'border-red-500' : 'border-stone-300'}`}
                  />
                </View>
              </View>

              {/* Pincode & Country */}
              <View className="flex-row gap-2.5">
                <View className="flex-1">
                  <Text className="text-xs font-bold text-[#553846] mb-1.5 ml-1">Pincode *</Text>
                  <TextInput
                    value={businessPincode}
                    onChangeText={setBusinessPincode}
                    keyboardType="numeric"
                    maxLength={6}
                    placeholder="Pincode"
                    placeholderTextColor="#A8929A"
                    className={`bg-white border rounded-xl px-3.5 py-2.5 text-xs text-[#3A2430] font-medium ${formErrors.businessPincode ? 'border-red-500' : 'border-stone-300'}`}
                  />
                </View>
                <View className="flex-1">
                  <Text className="text-xs font-bold text-[#553846] mb-1.5 ml-1">Country</Text>
                  <TextInput
                    value={businessCountry}
                    onChangeText={setBusinessCountry}
                    editable={false}
                    className="bg-stone-100 border border-stone-300 rounded-xl px-3.5 py-2.5 text-xs text-stone-600 font-bold"
                  />
                </View>
              </View>
            </View>
          )}

          {/* Optional GSTIN */}
          <View className="mt-3.5">
            <Text className="text-xs font-bold text-[#553846] mb-1.5 ml-1">
              GSTIN (Optional)
            </Text>
            <TextInput
              value={gstin}
              onChangeText={setGstin}
              autoCapitalize="characters"
              placeholder="e.g. 37AAAAA0000A1Z5"
              placeholderTextColor="#A8929A"
              className="bg-white border border-stone-300 rounded-xl px-3.5 py-2.5 text-xs text-[#3A2430] font-mono"
            />
          </View>
        </View>

        {/* ======================================================== */}
        {/* 4. VERIFICATION DOCUMENTS — OPTIONAL */}
        {/* ======================================================== */}
        <View className="mb-6 bg-white p-4 rounded-2xl border border-stone-200 shadow-2xs">
          <View className="flex-row items-center justify-between mb-1.5">
            <Text className="text-xs font-black text-[#C2477A] uppercase tracking-wider">
              Verification Documents
            </Text>
            <View className="bg-stone-100 px-2.5 py-0.5 rounded-full">
              <Text className="text-[10px] font-bold text-stone-600">
                Optional at Registration
              </Text>
            </View>
          </View>

          {/* Guidance note */}
          <View className="bg-[#FFF5F8] border border-[#F8BBD0] p-3 rounded-xl mb-4">
            <Text className="text-[11px] text-[#8C7078] leading-relaxed font-medium">
              Documents are optional at registration. Our verification team may request additional documents if required.
            </Text>
          </View>

          {/* 7 Standard Document Slots */}
          <View className="space-y-3">
            {STANDARD_DOCUMENT_SLOTS.map((slot) => {
              const uploadedDoc = documents.find(d => d.type === slot.key);
              const isRequestedByAdmin = requestedDocuments.includes(slot.key);

              return (
                <View
                  key={slot.key}
                  className={`p-3.5 rounded-xl border ${isRequestedByAdmin ? 'border-amber-400 bg-amber-50/50' : uploadedDoc ? 'border-emerald-300 bg-emerald-50/30' : 'border-stone-200 bg-stone-50/40'}`}
                >
                  <View className="flex-row items-center justify-between mb-1">
                    <View className="flex-row items-center gap-1.5 flex-1 mr-2">
                      <Ionicons
                        name={uploadedDoc ? "checkmark-circle" : "document-text-outline"}
                        size={16}
                        color={uploadedDoc ? "#059669" : "#C2477A"}
                      />
                      <Text className="text-xs font-bold text-[#3A2430]">
                        {slot.label}
                      </Text>
                    </View>

                    {isRequestedByAdmin ? (
                      <View className="bg-amber-100 border border-amber-300 px-2 py-0.5 rounded-full">
                        <Text className="text-[9.5px] font-black uppercase text-amber-800">
                          Requested
                        </Text>
                      </View>
                    ) : (
                      <View className="bg-stone-200/80 px-2 py-0.5 rounded-full">
                        <Text className="text-[9.5px] font-bold text-stone-600">
                          Optional
                        </Text>
                      </View>
                    )}
                  </View>

                  <Text className="text-[10.5px] text-stone-500 mb-2">
                    {slot.hint}
                  </Text>

                  {uploadedDoc ? (
                    <View className="bg-white p-2.5 rounded-lg border border-stone-200 flex-row items-center justify-between">
                      <View className="flex-row items-center gap-2 flex-1 mr-2">
                        {Boolean(uploadedDoc.url && typeof uploadedDoc.url === 'string' && !uploadedDoc.url.toLowerCase().includes('.pdf')) ? (
                          <Image
                            source={getSafeImageSource(uploadedDoc.url)}
                            className="w-9 h-9 rounded bg-stone-100"
                            resizeMode="cover"
                          />
                        ) : (
                          <View className="w-9 h-9 rounded bg-[#FFF0F5] items-center justify-center border border-[#FCE4EC]">
                            <Ionicons name="document-text" size={18} color="#C2477A" />
                          </View>
                        )}
                        <View className="flex-1">
                          <Text className="text-xs font-bold text-stone-800 truncate" numberOfLines={1}>
                            {uploadedDoc.name}
                          </Text>
                          <Text className="text-[10px] text-emerald-700 font-bold">✓ Attached</Text>
                        </View>
                      </View>

                      <View className="flex-row items-center gap-1">
                        <TouchableOpacity
                          onPress={() => setPreviewDocUrl(uploadedDoc.url)}
                          className="px-2 py-1 rounded bg-stone-100"
                        >
                          <Text className="text-[10.5px] font-bold text-stone-700">Preview</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          onPress={() => openUploadModal(slot)}
                          className="px-2 py-1 rounded bg-pink-50"
                        >
                          <Text className="text-[10.5px] font-bold text-[#C2477A]">Replace</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          onPress={() => handleRemoveDoc(slot.key)}
                          className="p-1 rounded bg-rose-50"
                        >
                          <Ionicons name="trash-outline" size={14} color="#DC2626" />
                        </TouchableOpacity>
                      </View>
                    </View>
                  ) : (
                    <TouchableOpacity
                      activeOpacity={0.8}
                      onPress={() => openUploadModal(slot)}
                      className="bg-white border border-dashed border-[#C2477A] py-2 px-3 rounded-lg flex-row items-center justify-center gap-1.5 active:bg-pink-50"
                    >
                      <Ionicons name="cloud-upload-outline" size={14} color="#C2477A" />
                      <Text className="text-xs font-black text-[#C2477A]">
                        {isRequestedByAdmin ? 'Upload Requested Document' : 'Upload Document'}
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              );
            })}
          </View>
        </View>

        {/* SUBMIT BUTTON */}
        <TouchableOpacity
          activeOpacity={0.9}
          disabled={isSubmitting}
          onPress={handleSubmit}
          className="w-full bg-[#C2477A] py-4 rounded-full items-center justify-center shadow-lg active:opacity-90 mt-2"
        >
          {isSubmitting ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text className="text-white font-black text-base tracking-wide">
              {isResubmission ? 'Update Details & Resubmit' : (isApproved || isPending ? 'Update Verification Details' : 'Submit for Verification')}
            </Text>
          )}
        </TouchableOpacity>

        <Text className="text-[11px] text-[#8C7078] text-center mt-3 font-medium">
          Salbeau verification desk will review your details. Verification usually completes within 24 hours.
        </Text>
      </ScrollView>

      {/* MODAL: Upload / Attach Document */}
      <Modal
        visible={Boolean(activeUploadSlot)}
        transparent
        animationType="slide"
        onRequestClose={() => setActiveUploadSlot(null)}
      >
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-white rounded-t-3xl p-5 space-y-4">
            <View className="flex-row items-center justify-between pb-2 border-b border-stone-200">
              <Text className="text-sm font-black text-[#3A2430]">
                Attach {activeUploadSlot?.label}
              </Text>
              <TouchableOpacity onPress={() => setActiveUploadSlot(null)}>
                <Ionicons name="close" size={20} color="#3A2430" />
              </TouchableOpacity>
            </View>

            <View>
              <Text className="text-xs font-bold text-stone-700 mb-1">Document Title</Text>
              <TextInput
                value={uploadDocName}
                onChangeText={setUploadDocName}
                placeholder="e.g. My PAN Card"
                placeholderTextColor="#A8929A"
                className="bg-white border border-stone-300 rounded-xl px-3.5 py-2.5 text-xs text-[#3A2430] font-medium"
              />
            </View>

            <View>
              <Text className="text-xs font-bold text-stone-700 mb-1">Document Image Link / URL</Text>
              <TextInput
                value={uploadDocUrl}
                onChangeText={setUploadDocUrl}
                autoCapitalize="none"
                placeholder="https://... (or leave blank to use sample copy)"
                placeholderTextColor="#A8929A"
                className="bg-white border border-stone-300 rounded-xl px-3.5 py-2.5 text-xs text-[#3A2430] font-medium"
              />
            </View>

            <View className="flex-row gap-2.5 pt-2">
              <TouchableOpacity
                onPress={() => setActiveUploadSlot(null)}
                className="flex-1 py-3 rounded-full bg-stone-200 items-center justify-center"
              >
                <Text className="text-xs font-bold text-stone-700">Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleSaveUploadedDoc}
                className="flex-1 py-3 rounded-full bg-[#C2477A] items-center justify-center shadow-sm"
              >
                <Text className="text-xs font-black text-white">Save & Attach</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* MODAL: Full Screen Image Preview */}
      <Modal
        visible={Boolean(previewDocUrl)}
        transparent
        animationType="fade"
        onRequestClose={() => setPreviewDocUrl(null)}
      >
        <View className="flex-1 bg-black/90 justify-center items-center p-4">
          <TouchableOpacity
            onPress={() => setPreviewDocUrl(null)}
            className="absolute top-12 right-6 w-10 h-10 rounded-full bg-white/20 items-center justify-center"
          >
            <Ionicons name="close" size={24} color="#FFFFFF" />
          </TouchableOpacity>

          {Boolean(previewDocUrl && typeof previewDocUrl === 'string' && previewDocUrl.trim().length > 0) && (
            <Image
              source={getSafeImageSource(previewDocUrl)}
              className="w-full h-4/5 rounded-2xl"
              resizeMode="contain"
            />
          )}
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
};
