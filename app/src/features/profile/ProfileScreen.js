import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
  Platform,
  StatusBar,
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../../context/AppContext';
import { lookupIndianPincode, validateIndianPincode } from '../../utils/pincodeService';
import { isB2BRole, isUserB2BVerified, ROLE_SHORT_TITLES } from '../../utils/b2bVerificationService';

// Salbeau Brand Design Tokens - Clean White Background Palette (No Pink Canvas)
const PALETTE = {
  bgPrimary: '#FFFFFF',       // Clean pure white page background (No pink)
  cardBg: '#FFFFFF',          // Clean white cards
  cardSurface: '#FFFFFF',     // Clean white surface
  cardInner: '#F9FAFB',       // Subtle neutral chip (non-pink)
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
    setCurrentScreen,
    orders = [],
    addresses = [],
    favorites = [],
    addAddress,
    updateAddress,
    deleteAddress,
    setDefaultAddress,
    logout
  } = useApp();

  const name = userProfile?.name || '';
  const email = userProfile?.email || '';
  const phone = userProfile?.phone || '';
  const address = userProfile?.address || (userProfile?.city ? `${userProfile.city}, ${userProfile.state} - ${userProfile.pincode}` : '');
  const initialLetter = name && name.trim().length > 0 ? name.trim().charAt(0).toUpperCase() : 'S';

  const [editType, setEditType] = useState(null); // null | 'profile' | 'saved_addresses' | 'address_form'
  const [editName, setEditName] = useState(name);
  const [editEmail, setEditEmail] = useState(email);
  const [editPhone, setEditPhone] = useState(phone);

  // Address Form States - completely empty initially for new address (NO mock data!)
  const [newAddressLabel, setNewAddressLabel] = useState('Home'); // 'Home' | 'Office' | 'Other'
  const [recipientName, setRecipientName] = useState('');
  const [recipientPhone, setRecipientPhone] = useState('');
  const [houseNo, setHouseNo] = useState('');
  const [streetArea, setStreetArea] = useState('');
  const [landmark, setLandmark] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [pincode, setPincode] = useState('');
  const [editingAddressId, setEditingAddressId] = useState(null);

  // Real Pincode Lookup States
  const [pincodeLoading, setPincodeLoading] = useState(false);
  const [pincodeStatus, setPincodeStatus] = useState(null); // 'searching' | 'found' | 'error' | null
  const [pincodeMessage, setPincodeMessage] = useState('');

  // Refs for debouncing and tracking looked-up pincode to avoid unwanted overwrites
  const lastLookedUpPincodeRef = useRef('');
  const pincodeDebounceRef = useRef(null);

  const getRoleTitle = () => {
    switch (userRole) {
      case 'salon': return 'Salon Owner Partner';
      case 'artist': return 'Makeup Artist Partner';
      case 'beautician': return 'Beautician Partner';
      case 'general':
      default: return 'Retail Customer';
    }
  };

  const openEditProfile = () => {
    setEditName(userProfile?.name || '');
    setEditEmail(userProfile?.email || '');
    setEditPhone(userProfile?.phone || '');
    setEditType('profile');
  };

  const openSavedAddresses = () => {
    setEditType('saved_addresses');
  };

  // 1. New Address: When user opens Add Delivery Address, ALL address fields must be EMPTY
  const openAddNewAddress = () => {
    setEditingAddressId(null);
    setNewAddressLabel('Home');
    setRecipientName('');
    setRecipientPhone('');
    setHouseNo('');
    setStreetArea('');
    setLandmark('');
    setCity('');
    setState('');
    setPincode('');
    setPincodeLoading(false);
    setPincodeStatus(null);
    setPincodeMessage('');
    lastLookedUpPincodeRef.current = '';
    if (pincodeDebounceRef.current) clearTimeout(pincodeDebounceRef.current);
    setEditType('address_form');
  };

  // 11. Existing saved address: When EDITING an existing saved address:
  // Load saved address values, do NOT perform auto pincode lookup on mount!
  const openEditSavedAddress = (addr) => {
    setEditingAddressId(addr.id);
    setNewAddressLabel(addr.label || 'Home');
    setRecipientName(addr.name || '');
    setRecipientPhone(addr.phone || '');
    setHouseNo(addr.houseNo || '');
    setStreetArea(addr.streetArea || '');
    setLandmark(addr.landmark || '');
    setCity(addr.city || '');
    setState(addr.state || '');
    const cleanPin = String(addr.pincode || '').replace(/\D/g, '').slice(0, 6);
    setPincode(cleanPin);
    // Mark as already looked-up so initial load does not trigger lookup
    lastLookedUpPincodeRef.current = cleanPin;
    setPincodeLoading(false);
    setPincodeStatus(null);
    setPincodeMessage('');
    if (pincodeDebounceRef.current) clearTimeout(pincodeDebounceRef.current);
    setEditType('address_form');
  };

  // 2, 5, 6, 8, 9: Pincode Change & Lookup Logic
  const handlePincodeChange = (text) => {
    const cleanPin = String(text || '').replace(/\D/g, '').slice(0, 6);
    setPincode(cleanPin);

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

    // 6-digit completed
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
          if (res.city) setCity(res.city);
          if (res.state) setState(res.state);
          // Only populate streetArea if empty or suggestion available
          if (res.locality && (!streetArea || streetArea.trim() === '')) {
            setStreetArea(res.locality);
          }
          // Note: Flat/House No. and Landmark are NEVER overwritten or reset!
        } else {
          setPincodeStatus('error');
          setPincodeMessage("We couldn't find this pincode. Please check it or enter the address manually.");
          // No mock data inserted!
        }
      } catch (err) {
        setPincodeLoading(false);
        setPincodeStatus('error');
        setPincodeMessage("We couldn't find this pincode. Please check it or enter the address manually.");
      }
    }, 300);
  };

  const handleSaveProfile = () => {
    if (!editName.trim()) {
      Alert.alert('Required', 'Please enter your full name');
      return;
    }
    setUserProfile(prev => ({
      ...prev,
      name: editName.trim(),
      email: editEmail.trim(),
      phone: editPhone.trim()
    }));
    setEditType(null);
    Alert.alert('Profile Saved', 'Your profile details have been updated successfully.');
  };

  // 10. Address editing: Save contains whatever values are currently present after user manual edits!
  const handleSaveAddressForm = () => {
    if (!recipientName.trim()) {
      Alert.alert('Required Field', 'Please enter the recipient full name.');
      return;
    }
    if (!recipientPhone.trim() || recipientPhone.trim().replace(/\D/g, '').length < 10) {
      Alert.alert('Required Field', 'Please enter a valid 10-digit mobile number.');
      return;
    }
    if (!pincode.trim() || pincode.trim().length !== 6) {
      Alert.alert('Required Field', 'Please enter a valid 6-digit PIN code.');
      return;
    }
    if (!city.trim()) {
      Alert.alert('Required Field', 'Please enter the city / district.');
      return;
    }
    if (!state.trim()) {
      Alert.alert('Required Field', 'Please enter the state.');
      return;
    }
    if (!houseNo.trim()) {
      Alert.alert('Required Field', 'Please enter your flat, house number, or building name.');
      return;
    }
    if (!streetArea.trim()) {
      Alert.alert('Required Field', 'Please enter your street address or locality.');
      return;
    }

    const parts = [
      houseNo.trim(),
      streetArea.trim(),
      landmark.trim() ? `Near ${landmark.trim()}` : '',
      city.trim(),
      `${state.trim()} - ${pincode.trim()}`
    ].filter(Boolean);

    const fullText = parts.join(', ');

    const payload = {
      label: newAddressLabel,
      name: recipientName.trim(),
      phone: recipientPhone.trim(),
      houseNo: houseNo.trim(),
      streetArea: streetArea.trim(),
      landmark: landmark.trim(),
      city: city.trim(),
      state: state.trim(),
      pincode: pincode.trim(),
      text: fullText
    };

    if (editingAddressId) {
      if (updateAddress) {
        updateAddress(editingAddressId, payload);
      }
      Alert.alert('Address Updated', `Delivery address (${newAddressLabel}) updated successfully!`);
    } else {
      if (addAddress) {
        addAddress(payload);
      }
      Alert.alert('Address Added', `New delivery address (${newAddressLabel}) saved successfully!`);
    }

    setEditType(null);
  };

  const handleLogout = () => {
    Alert.alert(
      'Log Out Salbeau Account',
      'Are you sure you want to sign out from your Salbeau account?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Log Out',
          style: 'destructive',
          onPress: () => {
            if (logout) {
              logout();
            } else {
              setCurrentScreen('onboarding');
            }
          }
        }
      ]
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 14, paddingBottom: 110 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Top Header Bar */}
        <View className="flex-row justify-between items-center mb-4 mt-1">
          <View>
            <Text style={{ color: PALETTE.textDark }} className="text-2xl font-black tracking-tight">
              My Profile
            </Text>
            <Text style={{ color: PALETTE.textMuted }} className="text-xs font-semibold">
              Manage your Salbeau account & preferences
            </Text>
          </View>

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => Alert.alert('Salbeau Helpdesk', 'Our beauty advisors are available 24/7 at support@salbeau.com')}
            style={{
              backgroundColor: '#FFFFFF',
              borderColor: PALETTE.borderNeutral,
              borderWidth: 1
            }}
            className="w-10 h-10 rounded-full items-center justify-center shadow-xs"
          >
            <Ionicons name="chatbubble-ellipses-outline" size={18} color={PALETTE.logoPink} />
          </TouchableOpacity>
        </View>

        {/* Hero User Identity Card */}
        <View
          style={{
            backgroundColor: '#FFFFFF',
            borderColor: PALETTE.borderLight,
            borderWidth: 1,
            shadowColor: '#000000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.04,
            shadowRadius: 8,
            elevation: 2
          }}
          className="rounded-3xl p-5 mb-4 relative"
        >
          {/* Top Row: Avatar + Name/Phone Info */}
          <View className="flex-row items-center gap-4 mb-4">
            {/* Signature Monogram Avatar with Double Ring */}
            <View className="relative">
              <View
                style={{
                  width: 66,
                  height: 66,
                  borderRadius: 33,
                  backgroundColor: PALETTE.logoPink,
                  borderColor: PALETTE.white,
                  borderWidth: 3,
                  shadowColor: PALETTE.logoPink,
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.25,
                  shadowRadius: 5,
                  elevation: 3
                }}
                className="items-center justify-center"
              >
                <Text className="text-2xl font-black text-white">
                  {initialLetter}
                </Text>
              </View>

              {/* Small Edit Pencil Badge */}
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={openEditProfile}
                style={{
                  backgroundColor: PALETTE.white,
                  borderColor: PALETTE.borderAccent,
                  borderWidth: 1.5
                }}
                className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full items-center justify-center shadow-xs"
              >
                <Ionicons name="pencil" size={11} color={PALETTE.logoPink} />
              </TouchableOpacity>
            </View>

            {/* Name, Role & Email */}
            <View className="flex-1 min-w-0">
              <Text
                style={{ color: PALETTE.textDark }}
                numberOfLines={1}
                className="text-lg font-black tracking-tight"
              >
                {name}
              </Text>

              <Text
                style={{ color: PALETTE.textMuted }}
                numberOfLines={1}
                className="text-xs font-semibold mb-1.5"
              >
                {phone}
              </Text>

              {/* Role Pill Badge */}
              <View
                style={{
                  backgroundColor: PALETTE.logoPinkLight,
                  borderColor: PALETTE.borderAccent,
                  borderWidth: 1
                }}
                className="self-start px-2.5 py-0.5 rounded-full flex-row items-center gap-1"
              >
                <Ionicons name="sparkles" size={10} color={PALETTE.logoPink} />
                <Text
                  style={{ color: PALETTE.logoPink }}
                  className="text-[10px] font-black uppercase tracking-wider"
                >
                  {getRoleTitle()}
                </Text>
              </View>
            </View>
          </View>

          {/* Quick Edit Profile Button Bar */}
          <View
            style={{
              borderTopColor: '#F3F4F6',
              borderTopWidth: 1,
              paddingTop: 12
            }}
            className="flex-row items-center justify-between"
          >
            <View className="flex-1 mr-2">
              <Text style={{ color: PALETTE.textSubtle }} className="text-[10px] font-bold uppercase tracking-wider">
                Email Address
              </Text>
              <Text style={{ color: PALETTE.textDark }} numberOfLines={1} className="text-xs font-semibold">
                {email}
              </Text>
            </View>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={openEditProfile}
              style={{
                backgroundColor: '#FFFFFF',
                borderColor: PALETTE.borderAccent,
                borderWidth: 1
              }}
              className="px-3.5 py-1.5 rounded-full flex-row items-center gap-1 shadow-xs"
            >
              <Ionicons name="create-outline" size={13} color={PALETTE.logoPink} />
              <Text style={{ color: PALETTE.logoPink }} className="text-[11px] font-bold">
                Edit Details
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* B2B Professional Verification Card */}
        {isB2BRole(userRole || userProfile?.role) && (() => {
          const vStatus = (userProfile?.verificationStatus || 'not_submitted').toLowerCase();
          const isVerified = isUserB2BVerified(userProfile);
          const roleLabel = ROLE_SHORT_TITLES[userRole || userProfile?.role] || 'Professional';

          let bg = '#FFF5F8';
          let border = '#F8BBD0';
          let iconName = 'shield-outline';
          let iconColor = PALETTE.logoPink;
          let title = 'Verify Professional Account';
          let subtitle = 'Submit credentials to activate wholesale pricing';
          let btnText = 'Verify Now';
          let target = 'b2b_verification';

          if (isVerified) {
            bg = '#F0FDF4';
            border = '#BBF7D0';
            iconName = 'shield-checkmark';
            iconColor = '#059669';
            title = `Verified ${roleLabel} Account`;
            subtitle = 'B2B Wholesale Pricing & Quantity Tiers Active';
            btnText = 'View Status';
            target = 'verification_status';
          } else if (vStatus === 'submitted' || vStatus === 'under_review') {
            bg = '#EFF6FF';
            border = '#BFDBFE';
            iconName = 'hourglass-outline';
            iconColor = '#2563EB';
            title = 'Verification Under Review';
            subtitle = 'Admin is reviewing your application';
            btnText = 'Check Status';
            target = 'verification_status';
          } else if (vStatus === 'resubmission_required' || vStatus === 'rejected') {
            bg = '#FFFBEB';
            border = '#FDE68A';
            iconName = 'alert-circle';
            iconColor = '#D97706';
            title = 'Action Required';
            subtitle = userProfile?.rejectionReason ? `"${userProfile.rejectionReason}"` : 'Admin requested updates on your verification';
            btnText = 'Update & Resubmit';
            target = 'b2b_verification';
          } else if (vStatus === 'suspended') {
            bg = '#FEF2F2';
            border = '#FECACA';
            iconName = 'ban';
            iconColor = '#DC2626';
            title = 'Account Suspended';
            subtitle = 'B2B pricing access suspended by admin';
            btnText = 'View Details';
            target = 'verification_status';
          }

          return (
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => setCurrentScreen(target)}
              style={{ backgroundColor: bg, borderColor: border, borderWidth: 1 }}
              className="rounded-2xl p-4 mb-4 flex-row items-center justify-between shadow-2xs"
            >
              <View className="flex-row items-center gap-3 flex-1 mr-2">
                <View className="w-10 h-10 rounded-full bg-white items-center justify-center shadow-xs">
                  <Ionicons name={iconName} size={20} color={iconColor} />
                </View>
                <View className="flex-1">
                  <Text className="text-xs font-black text-[#1E1B1D]">
                    {title}
                  </Text>
                  <Text numberOfLines={1} className="text-[11px] font-medium text-[#6B5E65] mt-0.5">
                    {subtitle}
                  </Text>
                </View>
              </View>

              <View className="bg-white px-3 py-1.5 rounded-full border border-stone-200">
                <Text style={{ color: iconColor }} className="text-[10px] font-black uppercase">
                  {btnText}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })()}

        {/* Quick Highlights / Stats Strip (Orders, Addresses, Wishlist) */}
        <View className="flex-row gap-2.5 mb-4">
          {/* Card 1: My Orders */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => setCurrentScreen('orders')}
            style={{
              flex: 1,
              backgroundColor: '#FFFFFF',
              borderColor: PALETTE.borderLight,
              borderWidth: 1
            }}
            className="rounded-2xl p-3.5 items-center shadow-xs"
          >
            <View
              style={{ backgroundColor: '#F9FAFB', borderColor: PALETTE.borderLight, borderWidth: 1 }}
              className="w-10 h-10 rounded-full items-center justify-center mb-2"
            >
              <Ionicons name="bag-handle-outline" size={19} color={PALETTE.logoPink} />
            </View>
            <Text style={{ color: PALETTE.textDark }} className="text-base font-black">
              {orders.length}
            </Text>
            <Text style={{ color: PALETTE.textMuted }} className="text-[10px] font-bold uppercase tracking-wider">
              Orders
            </Text>
          </TouchableOpacity>

          {/* Card 2: Saved Addresses */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={openSavedAddresses}
            style={{
              flex: 1,
              backgroundColor: '#FFFFFF',
              borderColor: PALETTE.borderLight,
              borderWidth: 1
            }}
            className="rounded-2xl p-3.5 items-center shadow-xs"
          >
            <View
              style={{ backgroundColor: '#F9FAFB', borderColor: PALETTE.borderLight, borderWidth: 1 }}
              className="w-10 h-10 rounded-full items-center justify-center mb-2"
            >
              <Ionicons name="location-outline" size={19} color={PALETTE.logoPink} />
            </View>
            <Text style={{ color: PALETTE.textDark }} className="text-base font-black">
              {addresses.length || (address ? 1 : 0)}
            </Text>
            <Text style={{ color: PALETTE.textMuted }} className="text-[10px] font-bold uppercase tracking-wider">
              Addresses
            </Text>
          </TouchableOpacity>

          {/* Card 3: Wishlist */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => setCurrentScreen('wishlist')}
            style={{
              flex: 1,
              backgroundColor: '#FFFFFF',
              borderColor: PALETTE.borderLight,
              borderWidth: 1
            }}
            className="rounded-2xl p-3.5 items-center shadow-xs"
          >
            <View
              style={{ backgroundColor: '#F9FAFB', borderColor: PALETTE.borderLight, borderWidth: 1 }}
              className="w-10 h-10 rounded-full items-center justify-center mb-2"
            >
              <Ionicons name={favorites.length > 0 ? "heart" : "heart-outline"} size={19} color={PALETTE.logoPink} />
            </View>
            <Text style={{ color: PALETTE.textDark }} className="text-base font-black">
              {favorites.length}
            </Text>
            <Text style={{ color: PALETTE.textMuted }} className="text-[10px] font-bold uppercase tracking-wider">
              Wishlist
            </Text>
          </TouchableOpacity>
        </View>

        {/* Primary Delivery Address Box */}
        <View
          style={{
            backgroundColor: '#FFFFFF',
            borderColor: PALETTE.borderLight,
            borderWidth: 1
          }}
          className="rounded-2xl p-4 mb-4 shadow-xs"
        >
          <View className="flex-row justify-between items-center mb-2">
            <View className="flex-row items-center gap-1.5">
              <Ionicons name="navigate-circle-outline" size={16} color={PALETTE.logoPink} />
              <Text style={{ color: PALETTE.textDark }} className="text-xs font-black uppercase tracking-wider">
                Default Shipping Address
              </Text>
            </View>

            <TouchableOpacity
              onPress={openAddNewAddress}
              style={{ backgroundColor: '#FFFFFF', borderColor: PALETTE.borderAccent, borderWidth: 1 }}
              className="px-2.5 py-1 rounded-lg"
            >
              <Text style={{ color: PALETTE.logoPink }} className="text-[10px] font-bold">
                + Add New
              </Text>
            </TouchableOpacity>
          </View>

          <Text style={{ color: PALETTE.textMuted }} numberOfLines={2} className="text-xs leading-relaxed mb-2 font-medium">
            {address}
          </Text>

          <TouchableOpacity
            onPress={openSavedAddresses}
            className="flex-row items-center gap-1"
          >
            <Text style={{ color: PALETTE.logoPink }} className="text-[11px] font-bold">
              Manage all saved addresses
            </Text>
            <Ionicons name="arrow-forward" size={11} color={PALETTE.logoPink} />
          </TouchableOpacity>
        </View>

        {/* Group 1: Account & Shopping Actions */}
        <Text
          style={{ color: PALETTE.textSubtle }}
          className="text-[10px] font-black uppercase tracking-wider ml-1 mb-2"
        >
          Orders & Shopping
        </Text>

        <View
          style={{
            backgroundColor: '#FFFFFF',
            borderColor: PALETTE.borderLight,
            borderWidth: 1
          }}
          className="rounded-2xl mb-4 overflow-hidden shadow-xs"
        >
          {[
            {
              title: 'My Orders & Order History',
              subtitle: 'Track live status and reorder items',
              icon: 'bag-handle-outline',
              action: () => setCurrentScreen('orders')
            },
            {
              title: 'Saved Delivery Addresses',
              subtitle: 'Manage home, office and branch shipping locations',
              icon: 'location-outline',
              action: openSavedAddresses
            },
            {
              title: 'Add New Shipping Address',
              subtitle: 'Quickly register a new address with PIN code',
              icon: 'add-circle-outline',
              action: openAddNewAddress
            },
            {
              title: 'Payment & Billing Preferences',
              subtitle: 'Cash on Delivery (COD) & UPI verified',
              icon: 'card-outline',
              action: () => Alert.alert('Payment Methods', 'Current Default: Cash on Delivery (COD). Online UPI payment is active on checkout.')
            }
          ].map((item, index, arr) => (
            <TouchableOpacity
              key={item.title}
              activeOpacity={0.7}
              onPress={item.action}
              style={{
                borderBottomColor: '#F3F4F6',
                borderBottomWidth: index === arr.length - 1 ? 0 : 1
              }}
              className="flex-row items-center justify-between py-3.5 px-4"
            >
              <View className="flex-row items-center gap-3 flex-1 mr-2">
                <View
                  style={{ backgroundColor: '#F9FAFB', borderColor: PALETTE.borderLight, borderWidth: 1 }}
                  className="w-9 h-9 rounded-xl items-center justify-center"
                >
                  <Ionicons name={item.icon} size={18} color={PALETTE.logoPink} />
                </View>
                <View className="flex-1">
                  <Text style={{ color: PALETTE.textDark }} className="text-xs font-bold">
                    {item.title}
                  </Text>
                  <Text style={{ color: PALETTE.textMuted }} numberOfLines={1} className="text-[10px]">
                    {item.subtitle}
                  </Text>
                </View>
              </View>

              <Ionicons name="chevron-forward" size={16} color={PALETTE.borderAccent} />
            </TouchableOpacity>
          ))}
        </View>

        {/* Group 2: Help & Salbeau Information */}
        <Text
          style={{ color: PALETTE.textSubtle }}
          className="text-[10px] font-black uppercase tracking-wider ml-1 mb-2"
        >
          Support & Brand
        </Text>

        <View
          style={{
            backgroundColor: '#FFFFFF',
            borderColor: PALETTE.borderLight,
            borderWidth: 1
          }}
          className="rounded-2xl mb-5 overflow-hidden shadow-xs"
        >
          {[
            {
              title: 'Help & Customer Care',
              subtitle: '24/7 dedicated customer concierge',
              icon: 'help-buoy-outline',
              action: () => Alert.alert('Customer Care', 'Email: support@salbeau.com\nHours: 9:00 AM - 9:00 PM IST')
            },
            {
              title: 'About Salbeau Beauty Platform',
              subtitle: 'Role-based beauty pricing for professionals & consumers',
              icon: 'information-circle-outline',
              action: () => Alert.alert('About Salbeau', 'Salbeau is a premium beauty and cosmetic platform offering professional salon-grade pricing, direct brand distribution, and doorstep delivery.')
            },
            {
              title: 'Terms of Service & Privacy',
              subtitle: 'Read our customer terms and return policies',
              icon: 'shield-checkmark-outline',
              action: () => Alert.alert('Legal & Privacy', 'All transactions and personal details are protected under standard encryption.')
            }
          ].map((item, index, arr) => (
            <TouchableOpacity
              key={item.title}
              activeOpacity={0.7}
              onPress={item.action}
              style={{
                borderBottomColor: '#F3F4F6',
                borderBottomWidth: index === arr.length - 1 ? 0 : 1
              }}
              className="flex-row items-center justify-between py-3.5 px-4"
            >
              <View className="flex-row items-center gap-3 flex-1 mr-2">
                <View
                  style={{ backgroundColor: '#F9FAFB', borderColor: PALETTE.borderLight, borderWidth: 1 }}
                  className="w-9 h-9 rounded-xl items-center justify-center"
                >
                  <Ionicons name={item.icon} size={18} color={PALETTE.logoPink} />
                </View>
                <View className="flex-1">
                  <Text style={{ color: PALETTE.textDark }} className="text-xs font-bold">
                    {item.title}
                  </Text>
                  <Text style={{ color: PALETTE.textMuted }} numberOfLines={1} className="text-[10px]">
                    {item.subtitle}
                  </Text>
                </View>
              </View>

              <Ionicons name="chevron-forward" size={16} color={PALETTE.borderAccent} />
            </TouchableOpacity>
          ))}
        </View>

        {/* Logout Button Styled on Clean White */}
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={handleLogout}
          style={{
            backgroundColor: '#FFFFFF',
            borderColor: PALETTE.borderAccent,
            borderWidth: 1.5,
            shadowColor: '#000000',
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.05,
            shadowRadius: 3,
            elevation: 1
          }}
          className="rounded-2xl py-3.5 px-5 items-center flex-row justify-center gap-2 mb-4"
        >
          <Ionicons name="log-out-outline" size={17} color={PALETTE.logoPink} />
          <Text style={{ color: PALETTE.logoPink }} className="text-xs font-black uppercase tracking-wider">
            LOG OUT SALBEAU ACCOUNT
          </Text>
        </TouchableOpacity>

        {/* Footer Brand Mark */}
        <View className="items-center mb-6">
          <Text style={{ color: PALETTE.textSubtle }} className="text-[11px] font-semibold">
            Salbeau Beauty Platform • Version 2.4.1
          </Text>
          <Text style={{ color: PALETTE.textSubtle }} className="text-[10px] mt-0.5">
            Designed for Salon Owners, Artists & Beauty Lovers
          </Text>
        </View>
      </ScrollView>

      {/* ========================================================
          1. Edit Profile Modal (Clean White Theme)
         ======================================================== */}
      <Modal
        visible={editType === 'profile'}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setEditType(null)}
      >
        <View
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.45)' }}
          className="flex-1 justify-center items-center p-4"
        >
          <View
            style={{
              backgroundColor: '#FFFFFF',
              borderColor: PALETTE.borderLight,
              borderWidth: 1,
              shadowColor: '#000000',
              shadowOffset: { width: 0, height: 8 },
              shadowOpacity: 0.12,
              shadowRadius: 18,
              elevation: 8
            }}
            className="rounded-3xl p-6 w-full max-w-sm"
          >
            {/* Modal Header */}
            <View
              style={{ borderBottomColor: '#F3F4F6', borderBottomWidth: 1 }}
              className="flex-row justify-between items-center pb-3 mb-4"
            >
              <View>
                <Text style={{ color: PALETTE.textDark }} className="text-base font-black tracking-tight">
                  Edit Profile Details
                </Text>
                <Text style={{ color: PALETTE.textMuted }} className="text-[10px] font-semibold">
                  Update your contact information
                </Text>
              </View>

              <TouchableOpacity
                onPress={() => setEditType(null)}
                style={{ backgroundColor: '#F3F4F6' }}
                className="w-8 h-8 rounded-full items-center justify-center"
              >
                <Ionicons name="close" size={18} color={PALETTE.textMuted} />
              </TouchableOpacity>
            </View>

            {/* Input 1: Full Name */}
            <View className="mb-3.5">
              <Text style={{ color: PALETTE.textDark }} className="text-[10px] font-bold uppercase tracking-wider mb-1.5">
                Full Name *
              </Text>
              <TextInput
                value={editName}
                onChangeText={setEditName}
                placeholder="Enter full name"
                placeholderTextColor={PALETTE.textSubtle}
                style={{
                  backgroundColor: '#FFFFFF',
                  borderColor: PALETTE.borderNeutral,
                  borderWidth: 1,
                  color: PALETTE.textDark
                }}
                className="rounded-xl px-3.5 py-2.5 text-xs font-bold"
              />
            </View>

            {/* Input 2: Email */}
            <View className="mb-3.5">
              <Text style={{ color: PALETTE.textDark }} className="text-[10px] font-bold uppercase tracking-wider mb-1.5">
                Email Address
              </Text>
              <TextInput
                value={editEmail}
                onChangeText={setEditEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                placeholder="Enter email address"
                placeholderTextColor={PALETTE.textSubtle}
                style={{
                  backgroundColor: '#FFFFFF',
                  borderColor: PALETTE.borderNeutral,
                  borderWidth: 1,
                  color: PALETTE.textDark
                }}
                className="rounded-xl px-3.5 py-2.5 text-xs font-bold"
              />
            </View>

            {/* Input 3: Phone */}
            <View className="mb-5">
              <Text style={{ color: PALETTE.textDark }} className="text-[10px] font-bold uppercase tracking-wider mb-1.5">
                Phone Number
              </Text>
              <TextInput
                value={editPhone}
                onChangeText={setEditPhone}
                keyboardType="phone-pad"
                placeholder="Enter phone number"
                placeholderTextColor={PALETTE.textSubtle}
                style={{
                  backgroundColor: '#FFFFFF',
                  borderColor: PALETTE.borderNeutral,
                  borderWidth: 1,
                  color: PALETTE.textDark
                }}
                className="rounded-xl px-3.5 py-2.5 text-xs font-bold"
              />
            </View>

            {/* Actions */}
            <View className="flex-row gap-2.5">
              <TouchableOpacity
                onPress={() => setEditType(null)}
                style={{
                  backgroundColor: '#FFFFFF',
                  borderColor: PALETTE.borderNeutral,
                  borderWidth: 1
                }}
                className="flex-1 py-3 rounded-xl items-center"
              >
                <Text style={{ color: PALETTE.textMuted }} className="text-xs font-bold">
                  Cancel
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleSaveProfile}
                style={{
                  backgroundColor: PALETTE.logoPink,
                  shadowColor: PALETTE.logoPink,
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.25,
                  shadowRadius: 4,
                  elevation: 2
                }}
                className="flex-1 py-3 rounded-xl items-center"
              >
                <Text className="text-xs font-black text-white tracking-wide">
                  Save Changes
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ========================================================
          2. Saved Delivery Addresses Modal (Manage Addresses)
         ======================================================== */}
      <Modal
        visible={editType === 'saved_addresses'}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setEditType(null)}
      >
        <View style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
          <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

          {/* Clean Top Header */}
          <View
            style={{
              backgroundColor: '#FFFFFF',
              borderBottomColor: '#F3F4F6',
              borderBottomWidth: 1,
              paddingTop: Platform.OS === 'ios' ? 48 : 20,
              paddingBottom: 14,
              paddingHorizontal: 16
            }}
            className="flex-row items-center justify-between shadow-xs"
          >
            <View className="flex-row items-center gap-3">
              <TouchableOpacity
                onPress={() => setEditType(null)}
                style={{
                  backgroundColor: '#FFFFFF',
                  borderColor: PALETTE.borderNeutral,
                  borderWidth: 1
                }}
                className="w-10 h-10 rounded-full items-center justify-center"
              >
                <Ionicons name="chevron-back" size={20} color={PALETTE.logoPink} />
              </TouchableOpacity>

              <View>
                <Text style={{ color: PALETTE.textDark }} className="text-base font-black tracking-tight">
                  Saved Delivery Addresses
                </Text>
                <Text style={{ color: PALETTE.textMuted }} className="text-[11px] font-semibold">
                  Manage shipping destinations
                </Text>
              </View>
            </View>

            <TouchableOpacity
              onPress={openAddNewAddress}
              style={{ backgroundColor: PALETTE.logoPinkLight, borderColor: PALETTE.borderAccent, borderWidth: 1 }}
              className="px-3 py-1.5 rounded-full flex-row items-center gap-1"
            >
              <Ionicons name="add" size={15} color={PALETTE.logoPink} />
              <Text style={{ color: PALETTE.logoPink }} className="text-xs font-bold">
                Add New
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 100 }}>
            {addresses.length === 0 ? (
              <View
                style={{
                  backgroundColor: '#FFFFFF',
                  borderColor: PALETTE.borderLight,
                  borderWidth: 1
                }}
                className="rounded-3xl p-8 items-center text-center my-6 shadow-xs"
              >
                <View
                  style={{ backgroundColor: '#FDF2F8' }}
                  className="w-16 h-16 rounded-full items-center justify-center mb-4"
                >
                  <Ionicons name="location-outline" size={32} color={PALETTE.logoPink} />
                </View>
                <Text style={{ color: PALETTE.textDark }} className="text-base font-black mb-1">
                  No Saved Addresses
                </Text>
                <Text style={{ color: PALETTE.textMuted }} className="text-xs text-center leading-relaxed mb-5">
                  You haven't added any shipping addresses yet. Add your address for faster checkout.
                </Text>
                <TouchableOpacity
                  onPress={openAddNewAddress}
                  style={{ backgroundColor: PALETTE.logoPink }}
                  className="px-6 py-3 rounded-full flex-row items-center gap-2 shadow-sm"
                >
                  <Ionicons name="add-circle-outline" size={18} color="#FFFFFF" />
                  <Text className="text-xs font-black text-white uppercase tracking-wider">
                    Add Delivery Address
                  </Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View className="space-y-3.5">
                {addresses.map((item) => (
                  <View
                    key={item.id}
                    style={{
                      backgroundColor: '#FFFFFF',
                      borderColor: item.isDefault ? PALETTE.logoPink : PALETTE.borderNeutral,
                      borderWidth: 1.5
                    }}
                    className="rounded-2xl p-4 shadow-xs"
                  >
                    <View className="flex-row justify-between items-center mb-2">
                      <View className="flex-row items-center gap-2">
                        <View
                          style={{
                            backgroundColor: item.isDefault ? PALETTE.logoPink : '#F3F4F6'
                          }}
                          className="px-2.5 py-0.5 rounded-full"
                        >
                          <Text
                            style={{
                              color: item.isDefault ? '#FFFFFF' : PALETTE.textDark
                            }}
                            className="text-[10px] font-black uppercase"
                          >
                            {item.label || 'Address'}
                          </Text>
                        </View>
                        {item.isDefault && (
                          <Text style={{ color: PALETTE.logoPink }} className="text-[10px] font-bold">
                            (Default)
                          </Text>
                        )}
                      </View>

                      {!item.isDefault && (
                        <TouchableOpacity
                          onPress={() => setDefaultAddress && setDefaultAddress(item.id)}
                          className="px-2 py-0.5"
                        >
                          <Text style={{ color: PALETTE.logoPink }} className="text-[11px] font-bold">
                            Set as Default
                          </Text>
                        </TouchableOpacity>
                      )}
                    </View>

                    {(item.name || item.phone) ? (
                      <Text style={{ color: PALETTE.textDark }} className="text-xs font-bold mb-1">
                        {item.name} {item.phone ? `• ${item.phone}` : ''}
                      </Text>
                    ) : null}

                    <Text style={{ color: PALETTE.textMuted }} className="text-xs leading-relaxed mb-3 font-medium">
                      {item.text}
                    </Text>

                    <View className="flex-row items-center justify-end gap-2 pt-2 border-t border-gray-100">
                      <TouchableOpacity
                        onPress={() => openEditSavedAddress(item)}
                        style={{
                          backgroundColor: '#FFFFFF',
                          borderColor: PALETTE.borderNeutral,
                          borderWidth: 1
                        }}
                        className="px-3 py-1.5 rounded-lg flex-row items-center gap-1.5"
                      >
                        <Ionicons name="create-outline" size={14} color={PALETTE.textDark} />
                        <Text style={{ color: PALETTE.textDark }} className="text-xs font-bold">
                          Edit
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        onPress={() => {
                          Alert.alert(
                            'Delete Address',
                            'Are you sure you want to delete this delivery address?',
                            [
                              { text: 'Cancel', style: 'cancel' },
                              {
                                text: 'Delete',
                                style: 'destructive',
                                onPress: () => deleteAddress && deleteAddress(item.id)
                              }
                            ]
                          );
                        }}
                        style={{
                          backgroundColor: '#FEE2E2',
                          borderColor: '#FECACA',
                          borderWidth: 1
                        }}
                        className="px-3 py-1.5 rounded-lg flex-row items-center gap-1.5"
                      >
                        <Ionicons name="trash-outline" size={14} color="#DC2626" />
                        <Text className="text-xs font-bold text-red-600">
                          Delete
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </ScrollView>
        </View>
      </Modal>

      {/* ========================================================
          3. FULL SCREEN Add / Edit Delivery Address Modal
         ======================================================== */}
      <Modal
        visible={editType === 'address_form'}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setEditType(null)}
      >
        <View style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
          <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

          {/* Clean Top Header */}
          <View
            style={{
              backgroundColor: '#FFFFFF',
              borderBottomColor: '#F3F4F6',
              borderBottomWidth: 1,
              paddingTop: Platform.OS === 'ios' ? 48 : 20,
              paddingBottom: 14,
              paddingHorizontal: 16
            }}
            className="flex-row items-center gap-3 shadow-xs"
          >
            <TouchableOpacity
              onPress={() => setEditType(null)}
              style={{
                backgroundColor: '#FFFFFF',
                borderColor: PALETTE.borderNeutral,
                borderWidth: 1
              }}
              className="w-10 h-10 rounded-full items-center justify-center"
            >
              <Ionicons name="chevron-back" size={20} color={PALETTE.logoPink} />
            </TouchableOpacity>

            <View>
              <Text style={{ color: PALETTE.textDark }} className="text-base font-black tracking-tight">
                {editingAddressId ? 'Edit Delivery Address' : 'Add Delivery Address'}
              </Text>
              <Text style={{ color: PALETTE.textMuted }} className="text-[11px] font-semibold">
                {editingAddressId ? 'Update location and recipient details' : 'Enter recipient and location details'}
              </Text>
            </View>
          </View>

          <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 120 }}>
            {/* Address Tag Selector */}
            <View
              style={{
                backgroundColor: '#FFFFFF',
                borderColor: PALETTE.borderLight,
                borderWidth: 1
              }}
              className="rounded-2xl p-4 mb-4 shadow-xs"
            >
              <Text style={{ color: PALETTE.textDark, fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>
                Save Address As
              </Text>

              <View className="flex-row gap-2.5">
                {[
                  { id: 'Home', icon: 'home-outline' },
                  { id: 'Office', icon: 'briefcase-outline' },
                  { id: 'Other', icon: 'location-outline' }
                ].map((item) => {
                  const isSelected = newAddressLabel === item.id;
                  return (
                    <TouchableOpacity
                      key={item.id}
                      onPress={() => setNewAddressLabel(item.id)}
                      style={{
                        backgroundColor: isSelected ? PALETTE.logoPink : '#FFFFFF',
                        borderColor: isSelected ? PALETTE.logoPink : PALETTE.borderNeutral,
                        borderWidth: 1
                      }}
                      className="flex-1 py-2 px-2.5 rounded-xl items-center flex-row justify-center gap-1.5 shadow-xs"
                    >
                      <Ionicons
                        name={item.icon}
                        size={15}
                        color={isSelected ? PALETTE.white : PALETTE.textMuted}
                      />
                      <Text
                        style={{ color: isSelected ? PALETTE.white : PALETTE.textDark }}
                        className="text-xs font-bold"
                      >
                        {item.id}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Recipient Details Box */}
            <View
              style={{
                backgroundColor: '#FFFFFF',
                borderColor: PALETTE.borderLight,
                borderWidth: 1
              }}
              className="rounded-2xl p-4 mb-4 shadow-xs"
            >
              <Text style={{ color: PALETTE.textDark, fontSize: 12, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 12 }}>
                Recipient Contact
              </Text>

              {/* Full Name */}
              <View style={{ marginBottom: 16 }}>
                <Text style={{ color: PALETTE.textDark, fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 }}>
                  Full Name *
                </Text>
                <View
                  style={{
                    backgroundColor: '#FFFFFF',
                    borderColor: PALETTE.borderNeutral,
                    borderWidth: 1,
                    height: 46,
                    borderRadius: 12,
                    paddingHorizontal: 12,
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 8
                  }}
                >
                  <Ionicons name="person-outline" size={16} color={PALETTE.logoPink} />
                  <TextInput
                    value={recipientName}
                    onChangeText={setRecipientName}
                    placeholder="Recipient Full Name"
                    placeholderTextColor={PALETTE.textSubtle}
                    style={{ color: PALETTE.textDark, flex: 1, height: '100%', fontSize: 13, fontWeight: '700', paddingVertical: 0 }}
                  />
                </View>
              </View>

              {/* Phone Number */}
              <View style={{ marginBottom: 4 }}>
                <Text style={{ color: PALETTE.textDark, fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 }}>
                  Phone Number *
                </Text>
                <View
                  style={{
                    backgroundColor: '#FFFFFF',
                    borderColor: PALETTE.borderNeutral,
                    borderWidth: 1,
                    height: 46,
                    borderRadius: 12,
                    paddingHorizontal: 12,
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 8
                  }}
                >
                  <Ionicons name="call-outline" size={16} color={PALETTE.logoPink} />
                  <TextInput
                    value={recipientPhone}
                    onChangeText={setRecipientPhone}
                    keyboardType="phone-pad"
                    placeholder="+91 10-digit mobile number"
                    placeholderTextColor={PALETTE.textSubtle}
                    style={{ color: PALETTE.textDark, flex: 1, height: '100%', fontSize: 13, fontWeight: '700', paddingVertical: 0 }}
                  />
                </View>
              </View>
            </View>

            {/* Location Details Box */}
            <View
              style={{
                backgroundColor: '#FFFFFF',
                borderColor: PALETTE.borderLight,
                borderWidth: 1
              }}
              className="rounded-2xl p-4 mb-4 shadow-xs"
            >
              <Text style={{ color: PALETTE.textDark, fontSize: 12, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 12 }}>
                Location Details
              </Text>

              {/* 1. PINCODE * (Trigger with real API lookup & status) */}
              <View style={{ marginBottom: 16 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <Text style={{ color: PALETTE.textDark, fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                    PINCODE *
                  </Text>
                  {pincodeLoading && (
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                      <ActivityIndicator size="small" color={PALETTE.logoPink} />
                      <Text style={{ color: PALETTE.logoPink, fontSize: 11, fontWeight: '700' }}>
                        Searching...
                      </Text>
                    </View>
                  )}
                  {!pincodeLoading && pincodeStatus === 'found' && (
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                      <Ionicons name="checkmark-circle" size={14} color="#16A34A" />
                      <Text style={{ color: '#16A34A', fontSize: 11, fontWeight: '700' }}>
                        ✓ Address found
                      </Text>
                    </View>
                  )}
                </View>

                <View
                  style={{
                    backgroundColor: '#FFFFFF',
                    borderColor: pincodeStatus === 'error' ? '#EF4444' : (pincodeStatus === 'found' ? '#16A34A' : PALETTE.borderNeutral),
                    borderWidth: 1,
                    height: 46,
                    borderRadius: 12,
                    paddingHorizontal: 12,
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 8
                  }}
                >
                  <Ionicons name="pin-outline" size={16} color={PALETTE.logoPink} />
                  <TextInput
                    value={pincode}
                    onChangeText={handlePincodeChange}
                    keyboardType="number-pad"
                    maxLength={6}
                    placeholder="Enter 6-digit Pincode"
                    placeholderTextColor={PALETTE.textSubtle}
                    style={{ color: PALETTE.textDark, flex: 1, height: '100%', fontSize: 13, fontWeight: '700', paddingVertical: 0 }}
                  />
                </View>
                {pincodeStatus === 'error' && (
                  <Text style={{ color: '#DC2626', fontSize: 11, fontWeight: '600', marginTop: 4 }}>
                    {pincodeMessage || "We couldn't find this pincode. Please check it or enter the address manually."}
                  </Text>
                )}
              </View>

              {/* 2. CITY * (Editable, suggested by API) */}
              <View style={{ marginBottom: 16 }}>
                <Text style={{ color: PALETTE.textDark, fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 }}>
                  CITY *
                </Text>
                <View
                  style={{
                    backgroundColor: '#FFFFFF',
                    borderColor: PALETTE.borderNeutral,
                    borderWidth: 1,
                    height: 46,
                    borderRadius: 12,
                    paddingHorizontal: 12,
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 8
                  }}
                >
                  <Ionicons name="location-sharp" size={16} color={PALETTE.logoPink} />
                  <TextInput
                    value={city}
                    onChangeText={setCity}
                    placeholder="City / District"
                    placeholderTextColor={PALETTE.textSubtle}
                    style={{ color: PALETTE.textDark, flex: 1, height: '100%', fontSize: 13, fontWeight: '700', paddingVertical: 0 }}
                  />
                </View>
              </View>

              {/* 3. STATE * (Editable, suggested by API) */}
              <View style={{ marginBottom: 16 }}>
                <Text style={{ color: PALETTE.textDark, fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 }}>
                  STATE *
                </Text>
                <View
                  style={{
                    backgroundColor: '#FFFFFF',
                    borderColor: PALETTE.borderNeutral,
                    borderWidth: 1,
                    height: 46,
                    borderRadius: 12,
                    paddingHorizontal: 12,
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 8
                  }}
                >
                  <Ionicons name="map-outline" size={16} color={PALETTE.logoPink} />
                  <TextInput
                    value={state}
                    onChangeText={setState}
                    placeholder="State"
                    placeholderTextColor={PALETTE.textSubtle}
                    style={{ color: PALETTE.textDark, flex: 1, height: '100%', fontSize: 13, fontWeight: '700', paddingVertical: 0 }}
                  />
                </View>
              </View>

              {/* 4. STREET / AREA * (Editable, suggested by API) */}
              <View style={{ marginBottom: 16 }}>
                <Text style={{ color: PALETTE.textDark, fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 }}>
                  STREET / AREA *
                </Text>
                <View
                  style={{
                    backgroundColor: '#FFFFFF',
                    borderColor: PALETTE.borderNeutral,
                    borderWidth: 1,
                    height: 46,
                    borderRadius: 12,
                    paddingHorizontal: 12,
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 8
                  }}
                >
                  <Ionicons name="navigate-outline" size={16} color={PALETTE.logoPink} />
                  <TextInput
                    value={streetArea}
                    onChangeText={setStreetArea}
                    placeholder="Street, Locality, Area, Sector"
                    placeholderTextColor={PALETTE.textSubtle}
                    style={{ color: PALETTE.textDark, flex: 1, height: '100%', fontSize: 13, fontWeight: '700', paddingVertical: 0 }}
                  />
                </View>
              </View>

              {/* 5. FLAT / HOUSE NO. * (User enters manually, never reset by pincode) */}
              <View style={{ marginBottom: 16 }}>
                <Text style={{ color: PALETTE.textDark, fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 }}>
                  FLAT / HOUSE NO. *
                </Text>
                <View
                  style={{
                    backgroundColor: '#FFFFFF',
                    borderColor: PALETTE.borderNeutral,
                    borderWidth: 1,
                    height: 46,
                    borderRadius: 12,
                    paddingHorizontal: 12,
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 8
                  }}
                >
                  <Ionicons name="business-outline" size={16} color={PALETTE.logoPink} />
                  <TextInput
                    value={houseNo}
                    onChangeText={setHouseNo}
                    placeholder="Flat, House No., Building Name"
                    placeholderTextColor={PALETTE.textSubtle}
                    style={{ color: PALETTE.textDark, flex: 1, height: '100%', fontSize: 13, fontWeight: '700', paddingVertical: 0 }}
                  />
                </View>
              </View>

              {/* 6. LANDMARK (User enters manually, optional) */}
              <View style={{ marginBottom: 4 }}>
                <Text style={{ color: PALETTE.textDark, fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 }}>
                  LANDMARK (OPTIONAL)
                </Text>
                <View
                  style={{
                    backgroundColor: '#FFFFFF',
                    borderColor: PALETTE.borderNeutral,
                    borderWidth: 1,
                    height: 46,
                    borderRadius: 12,
                    paddingHorizontal: 12,
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 8
                  }}
                >
                  <Ionicons name="compass-outline" size={16} color={PALETTE.logoPink} />
                  <TextInput
                    value={landmark}
                    onChangeText={setLandmark}
                    placeholder="e.g. Near Metro Station or BDA Complex"
                    placeholderTextColor={PALETTE.textSubtle}
                    style={{ color: PALETTE.textDark, flex: 1, height: '100%', fontSize: 13, fontWeight: '700', paddingVertical: 0 }}
                  />
                </View>
              </View>
            </View>
          </ScrollView>

          {/* Sticky Bottom Action Bar */}
          <View
            style={{
              paddingBottom: Platform.OS === 'ios' ? 28 : 16,
              backgroundColor: '#FFFFFF',
              borderTopColor: '#F3F4F6',
              borderTopWidth: 1
            }}
            className="absolute bottom-0 left-0 right-0 px-4 pt-3 shadow-lg z-50"
          >
            <TouchableOpacity
              activeOpacity={0.9}
              onPress={handleSaveAddressForm}
              style={{
                backgroundColor: PALETTE.logoPink,
                shadowColor: PALETTE.logoPink,
                shadowOffset: { width: 0, height: 3 },
                shadowOpacity: 0.3,
                shadowRadius: 6,
                elevation: 3
              }}
              className="rounded-full py-4 px-5 items-center flex-row justify-center gap-2"
            >
              <Ionicons name="checkmark-circle" size={18} color={PALETTE.white} />
              <Text className="text-xs font-black text-white uppercase tracking-wider">
                {editingAddressId ? 'UPDATE DELIVERY ADDRESS' : 'SAVE DELIVERY ADDRESS'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};
