import React, { useState, useMemo, useRef } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, Alert, Modal, Platform, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../../context/AppContext';
import { lookupIndianPincode, validateIndianPincode } from '../../utils/pincodeService';

export const PlaceOrderScreen = () => {
  const {
    cart,
    userProfile,
    addresses = [],
    addAddress,
    selectedBranch,
    placeOrder,
    setCurrentScreen,
    userRole,
    getRolePrice
  } = useApp();

  const [selectedPayment, setSelectedPayment] = useState('upi');
  const [isSummaryExpanded, setIsSummaryExpanded] = useState(false);
  const [selectedAddressId, setSelectedAddressId] = useState(
    addresses[0]?.id || 'default'
  );

  // Full Screen State for Adding New Address directly on Checkout - Starts EMPTY (No mock data!)
  const [showAddModal, setShowAddModal] = useState(false);
  const [newLabel, setNewLabel] = useState('Home'); // 'Home' | 'Office' | 'Other'
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  
  // Detailed address inputs - completely empty
  const [houseNo, setHouseNo] = useState('');
  const [streetArea, setStreetArea] = useState('');
  const [landmark, setLandmark] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [pincode, setPincode] = useState('');
  
  // Real Pincode Lookup States
  const [pincodeLoading, setPincodeLoading] = useState(false);
  const [pincodeStatus, setPincodeStatus] = useState(null); // 'searching' | 'found' | 'error' | null
  const [pincodeMessage, setPincodeMessage] = useState('');

  const lastLookedUpPincodeRef = useRef('');
  const pincodeDebounceRef = useRef(null);

  const openAddAddressModal = () => {
    setNewLabel('Home');
    setNewName('');
    setNewPhone('');
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
    setShowAddModal(true);
  };

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

  const [notes, setNotes] = useState('');

  const { totalItemCount, bagTotal } = useMemo(() => {
    let count = 0;
    let total = 0;
    for (const item of cart) {
      count += item.quantity;
      const rolePrice = getRolePrice(item.product, userRole, item.shade, item.quantity);
      total += (rolePrice * item.quantity);
    }
    return { totalItemCount: count, bagTotal: total };
  }, [cart, userRole, getRolePrice]);

  const discountAmount = 350;
  const totalPayable = Math.max(0, bagTotal - discountAmount);

  // Active address object or fallback string
  const activeAddr = addresses.find(a => a.id === selectedAddressId);
  const selectedAddressString = activeAddr
    ? `${activeAddr.label}: ${activeAddr.text} (${activeAddr.name || userProfile?.name || 'Customer'} • ${activeAddr.phone || userProfile?.phone || ''})`
    : (userProfile?.address || '');

  const handleSaveNewAddress = () => {
    if (!newName.trim()) {
      Alert.alert('Required Field', 'Please enter recipient name.');
      return;
    }
    if (!newPhone.trim() || newPhone.trim().replace(/\D/g, '').length < 10) {
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

    const created = addAddress ? addAddress({
      label: newLabel,
      name: newName.trim(),
      phone: newPhone.trim(),
      houseNo: houseNo.trim(),
      streetArea: streetArea.trim(),
      landmark: landmark.trim(),
      city: city.trim(),
      state: state.trim(),
      pincode: pincode.trim(),
      text: fullText
    }) : null;

    if (created && created.id) {
      setSelectedAddressId(created.id);
    }

    setShowAddModal(false);
    Alert.alert('Address Saved', `New delivery address (${newLabel}) added and selected.`);
  };

  const handleConfirmOrder = () => {
    const order = placeOrder({
      deliveryType: 'delivery',
      address: selectedAddressString,
      branch: selectedBranch,
      paymentMethod: selectedPayment,
      notes,
    });
    Alert.alert('Order Confirmed!', `Order ${order.id} placed successfully!`);
    setCurrentScreen('orders');
  };

  return (
    <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 110 }} className="bg-gray-50">
      {/* Header Row with Back Button & Title */}
      <View className="flex-row items-center gap-3 mb-5 mt-1">
        <TouchableOpacity
          onPress={() => setCurrentScreen('cart')}
          className="w-9 h-9 rounded-2xl bg-white border border-gray-200 items-center justify-center shadow-xs"
        >
          <Ionicons name="chevron-back" size={18} color="#1E293B" />
        </TouchableOpacity>
        <Text className="text-xl font-black text-slate-900 tracking-tight">Checkout</Text>
      </View>

      {/* Delivery Address Options Card Box */}
      <View className="bg-white rounded-2xl border border-gray-200 p-4 mb-4 shadow-xs">
        <View className="flex-row justify-between items-center mb-3.5">
          <Text className="text-xs font-black text-slate-900 uppercase tracking-wider">Select Delivery Address</Text>
          <TouchableOpacity
            onPress={openAddAddressModal}
            className="flex-row items-center gap-1 bg-gray-900 px-2.5 py-1 rounded-lg shadow-2xs"
          >
            <Ionicons name="add" size={14} color="#FFFFFF" />
            <Text className="text-[11px] font-bold text-white">+ Add New</Text>
          </TouchableOpacity>
        </View>

        {/* Address Options Box List */}
        <View className="space-y-3">
          {addresses.map((item) => {
            const isSelected = selectedAddressId === item.id;
            return (
              <TouchableOpacity
                key={item.id}
                onPress={() => setSelectedAddressId(item.id)}
                className={`p-3.5 rounded-xl border transition-all ${
                  isSelected
                    ? 'border-gray-900 bg-gray-50 shadow-2xs'
                    : 'border-gray-200 bg-white'
                }`}
              >
                <View className="flex-row items-start gap-3">
                  <Ionicons
                    name={isSelected ? "checkmark-circle" : "ellipse-outline"}
                    size={20}
                    color={isSelected ? "#1E293B" : "#94A3B8"}
                    style={{ marginTop: 2 }}
                  />
                  <View className="flex-1">
                    <View className="flex-row items-center gap-2 mb-1">
                      <View className="bg-gray-100 border border-gray-300 px-2 py-0.5 rounded-md">
                        <Text className="text-[10px] font-black text-gray-800 uppercase">
                          {item.label || 'Home'}
                        </Text>
                      </View>
                      {item.isDefault && (
                        <Text className="text-[9px] font-bold text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded border border-gray-200">
                          DEFAULT
                        </Text>
                      )}
                    </View>
                    <Text className="text-xs font-semibold text-slate-800 leading-relaxed">
                      {item.text}
                    </Text>
                    <Text className="text-[11px] font-bold text-slate-500 mt-1.5">
                      {item.name || userProfile?.name} • {item.phone || userProfile?.phone}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}

          {/* Fallback Option if addresses list is empty */}
          {addresses.length === 0 && (
            <TouchableOpacity
              onPress={() => setSelectedAddressId('default')}
              className="p-3.5 rounded-xl border border-gray-900 bg-gray-50"
            >
              <View className="flex-row items-start gap-3">
                <Ionicons name="checkmark-circle" size={20} color="#1E293B" style={{ marginTop: 2 }} />
                <View className="flex-1">
                  <Text className="text-xs font-bold text-slate-900 mb-0.5">
                    {userProfile?.name || 'Customer'}
                  </Text>
                  <Text className="text-xs font-medium text-slate-600 leading-relaxed">
                    {userProfile?.address || 'No address provided'}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Order Summary Accordion Card Box */}
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={() => setIsSummaryExpanded(!isSummaryExpanded)}
        className="bg-white rounded-2xl border border-gray-200 p-3.5 mb-4 flex-row items-center justify-between shadow-xs"
      >
        <View className="flex-row items-center gap-2.5">
          <Ionicons name="bag-handle-outline" size={17} color="#1E293B" />
          <Text className="text-xs font-bold text-slate-900">
            Order Summary ({totalItemCount} Items)
          </Text>
        </View>
        <Ionicons
          name={isSummaryExpanded ? "chevron-up" : "chevron-down"}
          size={16}
          color="#64748B"
        />
      </TouchableOpacity>

      {/* Expanded Order Items Preview */}
      {isSummaryExpanded && (
        <View className="bg-white border border-gray-200 rounded-2xl p-3 mb-4 space-y-2">
          {cart.map((item) => {
            const { product, quantity, shade } = item;
            const itemId = item.id || (shade ? `${product.id}_${shade.id || shade.name}` : product.id);
            const rolePrice = getRolePrice(product, userRole, shade, quantity);
            return (
              <View key={itemId} className="flex-row items-center justify-between py-1 border-b border-gray-100 last:border-b-0">
                <Text className="text-xs font-semibold text-slate-800 flex-1" numberOfLines={1}>
                  {product.name}{shade ? ` (${shade.name})` : ''} x {quantity}
                </Text>
                <Text className="text-xs font-bold text-slate-900 ml-2">₹{rolePrice * quantity}</Text>
              </View>
            );
          })}
        </View>
      )}

      {/* Payment Method Card Box - Cash on Delivery Only */}
      <View className="bg-white rounded-2xl border border-gray-200 p-4 mb-4 shadow-xs">
        <Text className="text-xs font-black text-slate-900 uppercase tracking-wider mb-3">
          Payment Method
        </Text>

        <View className="bg-gray-50 border border-gray-300 rounded-xl p-3.5 flex-row items-center justify-between">
          <View className="flex-row items-center gap-3 flex-1">
            <View className="w-9 h-9 rounded-xl bg-white items-center justify-center border border-gray-200 shadow-2xs">
              <Ionicons name="cash-outline" size={18} color="#1E293B" />
            </View>
            <View className="flex-col flex-1">
              <Text className="text-xs font-black text-slate-900">
                Cash on Delivery (COD)
              </Text>
              <Text className="text-[10px] font-semibold text-slate-500 mt-0.5">
                Pay cash upon delivery — No online gateway needed
              </Text>
            </View>
          </View>
          <Ionicons name="checkmark-circle" size={20} color="#1E293B" />
        </View>
      </View>

      {/* Payment Totals Breakdown Card Box */}
      <View className="bg-white rounded-2xl border border-gray-200 p-4 mb-5 shadow-xs">
        <View className="space-y-2">
          <View className="flex-row justify-between items-center mb-1">
            <Text className="text-xs font-medium text-slate-500">Item Total</Text>
            <Text className="text-xs font-extrabold text-slate-900">₹{bagTotal}</Text>
          </View>

          <View className="flex-row justify-between items-center mb-1">
            <Text className="text-xs font-medium text-slate-500">Delivery Charges</Text>
            <Text className="text-xs font-extrabold text-emerald-600">FREE</Text>
          </View>

          <View className="flex-row justify-between items-center mb-1">
            <Text className="text-xs font-medium text-slate-500">Discount Applied</Text>
            <Text className="text-xs font-extrabold text-emerald-600">-₹{discountAmount}</Text>
          </View>

          <View className="border-b border-gray-200 my-1" />

          <View className="flex-row justify-between items-center pt-1">
            <Text className="text-sm font-black text-slate-900">Grand Total</Text>
            <Text className="text-base font-black text-[#C2477A]">₹{totalPayable}</Text>
          </View>
        </View>
      </View>

      {/* Place Order Button */}
      <TouchableOpacity
        onPress={handleConfirmOrder}
        className="bg-[#C2477A] rounded-xl py-3.5 px-5 items-center shadow-md mb-6 active:opacity-90"
      >
        <Text className="text-xs font-black text-white uppercase tracking-wider">
          PLACE ORDER • ₹{totalPayable}
        </Text>
      </TouchableOpacity>

      {/* FULL SCREEN Add New Address Modal */}
      <Modal
        visible={showAddModal}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setShowAddModal(false)}
      >
        <View className="flex-1 bg-gray-50 relative">
          {/* Top Fixed Clean Header with Back Button */}
          <View className="bg-white px-4 pt-12 pb-3 border-b border-gray-200 flex-row items-center gap-3 shadow-xs">
            <TouchableOpacity
              onPress={() => setShowAddModal(false)}
              className="w-9 h-9 rounded-xl bg-gray-100 border border-gray-200 items-center justify-center"
            >
              <Ionicons name="chevron-back" size={18} color="#1E293B" />
            </TouchableOpacity>
            <View>
              <Text className="text-base font-black text-slate-900 tracking-tight">Add Delivery Address</Text>
              <Text className="text-[11px] font-medium text-slate-500">Enter shipping address details</Text>
            </View>
          </View>

          {/* ScrollView with 160px Bottom Padding */}
          <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 160 }}>
            {/* Address Tag Selector */}
            <View className="bg-white rounded-2xl border border-gray-200 p-4 mb-4 shadow-xs">
              <Text className="text-xs font-black text-slate-900 uppercase tracking-wider mb-2.5">
                Save Address As
              </Text>
              <View className="flex-row gap-2.5">
                {[
                  { id: 'Home', icon: 'home-outline' },
                  { id: 'Office', icon: 'briefcase-outline' },
                  { id: 'Other', icon: 'location-outline' }
                ].map((item) => {
                  const isSelected = newLabel === item.id;
                  return (
                    <TouchableOpacity
                      key={item.id}
                      onPress={() => setNewLabel(item.id)}
                      className={`flex-1 py-2 px-2.5 rounded-xl border items-center flex-row justify-center gap-1.5 ${
                        isSelected
                          ? 'bg-[#C2477A] border-[#C2477A] shadow-2xs'
                          : 'bg-white border-gray-200'
                      }`}
                    >
                      <Ionicons
                        name={item.icon}
                        size={15}
                        color={isSelected ? '#FFFFFF' : '#475569'}
                      />
                      <Text className={`text-xs font-bold ${isSelected ? 'text-white' : 'text-slate-700'}`}>
                        {item.id}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Recipient Details Card Box - Slim Compact Box Height (34px) with Clean Gap */}
            {/* Recipient Details Card Box */}
            <View className="bg-white rounded-2xl border border-gray-200 p-4 mb-4 shadow-xs">
              <Text className="text-xs font-black text-slate-900 uppercase tracking-wider mb-4">
                Recipient Contact
              </Text>

              {/* Recipient Name */}
              <View style={{ marginBottom: 16 }}>
                <Text className="text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Full Name *
                </Text>
                <View
                  style={{
                    backgroundColor: '#FFFFFF',
                    borderColor: '#E2E8F0',
                    borderWidth: 1,
                    height: 46,
                    borderRadius: 12,
                    paddingHorizontal: 12,
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 8
                  }}
                >
                  <Ionicons name="person-outline" size={16} color="#C2477A" />
                  <TextInput
                    value={newName}
                    onChangeText={setNewName}
                    placeholder="Recipient Full Name"
                    placeholderTextColor="#94A3B8"
                    style={{ color: '#1E293B', flex: 1, height: '100%', fontSize: 13, fontWeight: '700', paddingVertical: 0 }}
                  />
                </View>
              </View>

              {/* Mobile Phone Number */}
              <View style={{ marginBottom: 4 }}>
                <Text className="text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Mobile Phone Number *
                </Text>
                <View
                  style={{
                    backgroundColor: '#FFFFFF',
                    borderColor: '#E2E8F0',
                    borderWidth: 1,
                    height: 46,
                    borderRadius: 12,
                    paddingHorizontal: 12,
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 8
                  }}
                >
                  <Ionicons name="call-outline" size={16} color="#C2477A" />
                  <TextInput
                    value={newPhone}
                    onChangeText={setNewPhone}
                    keyboardType="phone-pad"
                    placeholder="+91 10-digit mobile number"
                    placeholderTextColor="#94A3B8"
                    style={{ color: '#1E293B', flex: 1, height: '100%', fontSize: 13, fontWeight: '700', paddingVertical: 0 }}
                  />
                </View>
              </View>
            </View>

            {/* Address Location Card Box */}
            <View className="bg-white rounded-2xl border border-gray-200 p-4 mb-4 shadow-xs">
              <Text className="text-xs font-black text-slate-900 uppercase tracking-wider mb-4">
                Location Details
              </Text>

              {/* 1. PINCODE * (Trigger with real API lookup & status) */}
              <View style={{ marginBottom: 16 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <Text className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                    PINCODE *
                  </Text>
                  {pincodeLoading && (
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                      <ActivityIndicator size="small" color="#C2477A" />
                      <Text style={{ color: '#C2477A', fontSize: 11, fontWeight: '700' }}>
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
                    borderColor: pincodeStatus === 'error' ? '#EF4444' : (pincodeStatus === 'found' ? '#16A34A' : '#E2E8F0'),
                    borderWidth: 1,
                    height: 46,
                    borderRadius: 12,
                    paddingHorizontal: 12,
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 8
                  }}
                >
                  <Ionicons name="pin-outline" size={16} color="#C2477A" />
                  <TextInput
                    value={pincode}
                    onChangeText={handlePincodeChange}
                    keyboardType="number-pad"
                    maxLength={6}
                    placeholder="Enter 6-digit Pincode"
                    placeholderTextColor="#94A3B8"
                    style={{ color: '#1E293B', flex: 1, height: '100%', fontSize: 13, fontWeight: '700', paddingVertical: 0 }}
                  />
                </View>
                {pincodeStatus === 'error' && (
                  <Text style={{ color: '#DC2626', fontSize: 11, fontWeight: '600', marginTop: 4 }}>
                    {pincodeMessage || "We couldn't find this pincode. Please check it or enter the address manually."}
                  </Text>
                )}
              </View>

              {/* 2. CITY * */}
              <View style={{ marginBottom: 16 }}>
                <Text className="text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  CITY *
                </Text>
                <View
                  style={{
                    backgroundColor: '#FFFFFF',
                    borderColor: '#E2E8F0',
                    borderWidth: 1,
                    height: 46,
                    borderRadius: 12,
                    paddingHorizontal: 12,
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 8
                  }}
                >
                  <Ionicons name="location-sharp" size={16} color="#C2477A" />
                  <TextInput
                    value={city}
                    onChangeText={setCity}
                    placeholder="City / District"
                    placeholderTextColor="#94A3B8"
                    style={{ color: '#1E293B', flex: 1, height: '100%', fontSize: 13, fontWeight: '700', paddingVertical: 0 }}
                  />
                </View>
              </View>

              {/* 3. STATE * */}
              <View style={{ marginBottom: 16 }}>
                <Text className="text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  STATE *
                </Text>
                <View
                  style={{
                    backgroundColor: '#FFFFFF',
                    borderColor: '#E2E8F0',
                    borderWidth: 1,
                    height: 46,
                    borderRadius: 12,
                    paddingHorizontal: 12,
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 8
                  }}
                >
                  <Ionicons name="map-outline" size={16} color="#C2477A" />
                  <TextInput
                    value={state}
                    onChangeText={setState}
                    placeholder="State"
                    placeholderTextColor="#94A3B8"
                    style={{ color: '#1E293B', flex: 1, height: '100%', fontSize: 13, fontWeight: '700', paddingVertical: 0 }}
                  />
                </View>
              </View>

              {/* 4. STREET / AREA * */}
              <View style={{ marginBottom: 16 }}>
                <Text className="text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  STREET / AREA *
                </Text>
                <View
                  style={{
                    backgroundColor: '#FFFFFF',
                    borderColor: '#E2E8F0',
                    borderWidth: 1,
                    height: 46,
                    borderRadius: 12,
                    paddingHorizontal: 12,
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 8
                  }}
                >
                  <Ionicons name="navigate-outline" size={16} color="#C2477A" />
                  <TextInput
                    value={streetArea}
                    onChangeText={setStreetArea}
                    placeholder="Street, Locality, Area, Sector"
                    placeholderTextColor="#94A3B8"
                    style={{ color: '#1E293B', flex: 1, height: '100%', fontSize: 13, fontWeight: '700', paddingVertical: 0 }}
                  />
                </View>
              </View>

              {/* 5. FLAT / HOUSE NO. * */}
              <View style={{ marginBottom: 16 }}>
                <Text className="text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  FLAT / HOUSE NO. *
                </Text>
                <View
                  style={{
                    backgroundColor: '#FFFFFF',
                    borderColor: '#E2E8F0',
                    borderWidth: 1,
                    height: 46,
                    borderRadius: 12,
                    paddingHorizontal: 12,
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 8
                  }}
                >
                  <Ionicons name="business-outline" size={16} color="#C2477A" />
                  <TextInput
                    value={houseNo}
                    onChangeText={setHouseNo}
                    placeholder="Flat, House No., Building Name"
                    placeholderTextColor="#94A3B8"
                    style={{ color: '#1E293B', flex: 1, height: '100%', fontSize: 13, fontWeight: '700', paddingVertical: 0 }}
                  />
                </View>
              </View>

              {/* 6. LANDMARK (OPTIONAL) */}
              <View style={{ marginBottom: 4 }}>
                <Text className="text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  LANDMARK (OPTIONAL)
                </Text>
                <View
                  style={{
                    backgroundColor: '#FFFFFF',
                    borderColor: '#E2E8F0',
                    borderWidth: 1,
                    height: 46,
                    borderRadius: 12,
                    paddingHorizontal: 12,
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 8
                  }}
                >
                  <Ionicons name="compass-outline" size={16} color="#C2477A" />
                  <TextInput
                    value={landmark}
                    onChangeText={setLandmark}
                    placeholder="e.g. Near BDA Complex or Metro Station"
                    placeholderTextColor="#94A3B8"
                    style={{ color: '#1E293B', flex: 1, height: '100%', fontSize: 13, fontWeight: '700', paddingVertical: 0 }}
                  />
                </View>
              </View>
            </View>
          </ScrollView>

          {/* Sticky Non-Overlapping Bottom Action Bar */}
          <View
            style={{ paddingBottom: Platform.OS === 'ios' ? 24 : 16 }}
            className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 pt-3 shadow-lg z-50"
          >
            <TouchableOpacity
              onPress={handleSaveNewAddress}
              className="bg-[#C2477A] rounded-xl py-3.5 px-5 items-center shadow-md active:opacity-90 flex-row justify-center gap-2"
            >
              <Ionicons name="checkmark-circle" size={17} color="#FFFFFF" />
              <Text className="text-xs font-black text-white uppercase tracking-wider">
                SAVE & DELIVER TO THIS ADDRESS
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};
