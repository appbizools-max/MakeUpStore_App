import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, Alert, Modal, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../../context/AppContext';

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

  // Full Screen State for Adding New Address directly on Checkout
  const [showAddModal, setShowAddModal] = useState(false);
  const [newLabel, setNewLabel] = useState('Home'); // 'Home' | 'Office' | 'Other' (NO STUDIO!)
  const [newName, setNewName] = useState(userProfile?.name || 'Bizools');
  const [newPhone, setNewPhone] = useState(userProfile?.phone || '+91 98765 43210');
  
  // Detailed address inputs
  const [houseNo, setHouseNo] = useState('');
  const [streetArea, setStreetArea] = useState('');
  const [landmark, setLandmark] = useState('');
  const [city, setCity] = useState('Bangalore');
  const [pincode, setPincode] = useState('560102');
  
  const [notes, setNotes] = useState('');

  const totalItemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const bagTotal = cart.reduce((sum, item) => {
    const rolePrice = getRolePrice(item.product, userRole);
    return sum + (rolePrice * item.quantity);
  }, 0);

  const discountAmount = 350;
  const totalPayable = Math.max(0, bagTotal - discountAmount);

  // Active address object or fallback string
  const activeAddr = addresses.find(a => a.id === selectedAddressId);
  const selectedAddressString = activeAddr
    ? `${activeAddr.label}: ${activeAddr.text} (${activeAddr.name || userProfile?.name} • ${activeAddr.phone || userProfile?.phone})`
    : (userProfile?.address || '102 Rosewood Heights, 4th Block, MG Road, Bengaluru - 560001');

  const handleSaveNewAddress = () => {
    const parts = [
      houseNo.trim(),
      streetArea.trim(),
      landmark.trim() ? `Near ${landmark.trim()}` : '',
      city.trim() ? `${city.trim()}${pincode.trim() ? ` - ${pincode.trim()}` : ''}` : pincode.trim()
    ].filter(Boolean);

    const fullText = parts.join(', ');

    if (!houseNo.trim() && !streetArea.trim()) {
      Alert.alert('Required Field', 'Please enter your flat/house number and street/area address.');
      return;
    }

    const created = addAddress ? addAddress({
      label: newLabel,
      name: newName || userProfile?.name || 'Bizools',
      phone: newPhone || userProfile?.phone || '+91 98765 43210',
      text: fullText
    }) : null;

    if (created && created.id) {
      setSelectedAddressId(created.id);
    }

    // Reset form fields
    setHouseNo('');
    setStreetArea('');
    setLandmark('');
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
            onPress={() => setShowAddModal(true)}
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
                    {userProfile?.name || 'Bizools'}
                  </Text>
                  <Text className="text-xs font-medium text-slate-600 leading-relaxed">
                    {userProfile?.address || '102 Rosewood Heights, 4th Block, MG Road, Bengaluru - 560001'}
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
          {cart.map(({ product, quantity }) => {
            const rolePrice = getRolePrice(product, userRole);
            return (
              <View key={product.id} className="flex-row items-center justify-between py-1 border-b border-gray-100 last:border-b-0">
                <Text className="text-xs font-semibold text-slate-800 flex-1" numberOfLines={1}>
                  {product.name} x {quantity}
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
            <View className="bg-white rounded-2xl border border-gray-200 p-4 mb-4 shadow-xs">
              <Text className="text-xs font-black text-slate-900 uppercase tracking-wider mb-4">
                Contact Information
              </Text>

              {/* Recipient Name */}
              <View className="mb-4">
                <Text className="text-[11px] font-black text-slate-700 uppercase tracking-wider">
                  Full Name *
                </Text>
                <View className="mt-2 flex-row items-center bg-gray-50 border border-gray-200 rounded-xl px-3 py-1 gap-2" style={{ height: 34 }}>
                  <Ionicons name="person-outline" size={14} color="#64748B" />
                  <TextInput
                    value={newName}
                    onChangeText={setNewName}
                    placeholder="Recipient Full Name"
                    placeholderTextColor="#94A3B8"
                    includeFontPadding={false}
                    style={{ paddingVertical: 0, textAlignVertical: 'center' }}
                    className="flex-1 text-xs font-bold text-slate-800"
                  />
                </View>
              </View>

              {/* Mobile Phone Number */}
              <View className="mb-1">
                <Text className="text-[11px] font-black text-slate-700 uppercase tracking-wider">
                  Mobile Phone Number *
                </Text>
                <View className="mt-2 flex-row items-center bg-gray-50 border border-gray-200 rounded-xl px-3 py-1 gap-2" style={{ height: 34 }}>
                  <Ionicons name="call-outline" size={14} color="#64748B" />
                  <TextInput
                    value={newPhone}
                    onChangeText={setNewPhone}
                    keyboardType="phone-pad"
                    placeholder="+91 10-digit mobile number"
                    placeholderTextColor="#94A3B8"
                    includeFontPadding={false}
                    style={{ paddingVertical: 0, textAlignVertical: 'center' }}
                    className="flex-1 text-xs font-bold text-slate-800"
                  />
                </View>
              </View>
            </View>

            {/* Address Location Card Box - Slim Compact Box Height (34px) with Clean Gap */}
            <View className="bg-white rounded-2xl border border-gray-200 p-4 mb-4 shadow-xs">
              <Text className="text-xs font-black text-slate-900 uppercase tracking-wider mb-4">
                Address Location Details
              </Text>

              {/* House / Building No */}
              <View className="mb-4">
                <Text className="text-[11px] font-black text-slate-700 uppercase tracking-wider">
                  Flat, House No., Building Name *
                </Text>
                <View className="mt-2 flex-row items-center bg-gray-50 border border-gray-200 rounded-xl px-3 py-1 gap-2" style={{ height: 34 }}>
                  <Ionicons name="business-outline" size={14} color="#64748B" />
                  <TextInput
                    value={houseNo}
                    onChangeText={setHouseNo}
                    placeholder="e.g. Flat 402, Rosewood Heights"
                    placeholderTextColor="#94A3B8"
                    includeFontPadding={false}
                    style={{ paddingVertical: 0, textAlignVertical: 'center' }}
                    className="flex-1 text-xs font-bold text-slate-800"
                  />
                </View>
              </View>

              {/* Street / Area / Sector */}
              <View className="mb-4">
                <Text className="text-[11px] font-black text-slate-700 uppercase tracking-wider">
                  Street Address, Area, Sector *
                </Text>
                <View className="mt-2 flex-row items-center bg-gray-50 border border-gray-200 rounded-xl px-3 py-1 gap-2" style={{ height: 34 }}>
                  <Ionicons name="map-outline" size={14} color="#64748B" />
                  <TextInput
                    value={streetArea}
                    onChangeText={setStreetArea}
                    placeholder="e.g. Sector 6, MG Road"
                    placeholderTextColor="#94A3B8"
                    includeFontPadding={false}
                    style={{ paddingVertical: 0, textAlignVertical: 'center' }}
                    className="flex-1 text-xs font-bold text-slate-800"
                  />
                </View>
              </View>

              {/* Landmark */}
              <View className="mb-4">
                <Text className="text-[11px] font-black text-slate-700 uppercase tracking-wider">
                  Landmark (Optional)
                </Text>
                <View className="mt-2 flex-row items-center bg-gray-50 border border-gray-200 rounded-xl px-3 py-1 gap-2" style={{ height: 34 }}>
                  <Ionicons name="compass-outline" size={14} color="#64748B" />
                  <TextInput
                    value={landmark}
                    onChangeText={setLandmark}
                    placeholder="e.g. Near BDA Complex"
                    placeholderTextColor="#94A3B8"
                    includeFontPadding={false}
                    style={{ paddingVertical: 0, textAlignVertical: 'center' }}
                    className="flex-1 text-xs font-bold text-slate-800"
                  />
                </View>
              </View>

              {/* City & Pincode Row */}
              <View className="flex-row gap-2.5">
                <View className="flex-1">
                  <Text className="text-[11px] font-black text-slate-700 uppercase tracking-wider">
                    City *
                  </Text>
                  <View className="mt-2 flex-row items-center bg-gray-50 border border-gray-200 rounded-xl px-3 py-1 gap-2" style={{ height: 34 }}>
                    <Ionicons name="location-sharp" size={14} color="#64748B" />
                    <TextInput
                      value={city}
                      onChangeText={setCity}
                      placeholder="City"
                      placeholderTextColor="#94A3B8"
                      includeFontPadding={false}
                      style={{ paddingVertical: 0, textAlignVertical: 'center' }}
                      className="flex-1 text-xs font-bold text-slate-800"
                    />
                  </View>
                </View>

                <View className="w-32">
                  <Text className="text-[11px] font-black text-slate-700 uppercase tracking-wider">
                    Pincode *
                  </Text>
                  <View className="mt-2 flex-row items-center bg-gray-50 border border-gray-200 rounded-xl px-3 py-1 gap-2" style={{ height: 34 }}>
                    <Ionicons name="pin-outline" size={14} color="#64748B" />
                    <TextInput
                      value={pincode}
                      onChangeText={setPincode}
                      keyboardType="number-pad"
                      placeholder="Pincode"
                      placeholderTextColor="#94A3B8"
                      includeFontPadding={false}
                      style={{ paddingVertical: 0, textAlignVertical: 'center' }}
                      className="flex-1 text-xs font-bold text-slate-800"
                    />
                  </View>
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
