import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Modal, TextInput, Alert, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../../context/AppContext';

export const ProfileScreen = () => {
  const { userProfile, setUserProfile, userRole, setCurrentScreen, addAddress } = useApp();

  const name = userProfile?.name || 'Bizools';
  const email = userProfile?.email || 'bizools@salbeau.com';
  const phone = userProfile?.phone || '+91 98765 43210';
  const address = userProfile?.address || '102 Rosewood Heights, 4th Block, MG Road, Bengaluru - 560001';
  const initialLetter = name.charAt(0).toUpperCase() || 'B';

  const [editType, setEditType] = useState(null); // null | 'profile' | 'address' | 'new_address'
  const [editName, setEditName] = useState(name);
  const [editEmail, setEditEmail] = useState(email);
  const [editPhone, setEditPhone] = useState(phone);
  const [editAddressText, setEditAddressText] = useState(address);
  
  // Full Screen New Address Form States
  const [newAddressLabel, setNewAddressLabel] = useState('Home'); // 'Home' | 'Office' | 'Other' (STUDIO REMOVED)
  const [recipientName, setRecipientName] = useState(name);
  const [recipientPhone, setRecipientPhone] = useState(phone);
  const [houseNo, setHouseNo] = useState('');
  const [streetArea, setStreetArea] = useState('');
  const [landmark, setLandmark] = useState('');
  const [city, setCity] = useState('Bangalore');
  const [pincode, setPincode] = useState('560102');

  const openEditProfile = () => {
    setEditName(userProfile?.name || 'Bizools');
    setEditEmail(userProfile?.email || 'bizools@salbeau.com');
    setEditPhone(userProfile?.phone || '+91 98765 43210');
    setEditType('profile');
  };

  const openEditAddress = () => {
    setEditAddressText(userProfile?.address || '102 Rosewood Heights, 4th Block, MG Road, Bengaluru - 560001');
    setEditType('address');
  };

  const openAddNewAddress = () => {
    setNewAddressLabel('Home');
    setRecipientName(name);
    setRecipientPhone(phone);
    setHouseNo('');
    setStreetArea('');
    setLandmark('');
    setEditType('new_address');
  };

  const handleSaveProfile = () => {
    if (!editName.trim()) {
      Alert.alert('Required', 'Please enter your name');
      return;
    }
    setUserProfile(prev => ({
      ...prev,
      name: editName,
      email: editEmail,
      phone: editPhone
    }));
    setEditType(null);
    Alert.alert('Profile Updated', 'Your profile details have been saved successfully.');
  };

  const handleSaveAddress = () => {
    if (!editAddressText.trim()) {
      Alert.alert('Required', 'Please enter a valid delivery address');
      return;
    }
    setUserProfile(prev => ({
      ...prev,
      address: editAddressText
    }));
    setEditType(null);
    Alert.alert('Address Updated', 'Your delivery address has been saved successfully.');
  };

  const handleSaveNewAddress = () => {
    const parts = [
      houseNo.trim(),
      streetArea.trim(),
      landmark.trim() ? `Near ${landmark.trim()}` : '',
      city.trim() ? `${city.trim()}${pincode.trim() ? ` - ${pincode.trim()}` : ''}` : pincode.trim()
    ].filter(Boolean);

    const fullText = parts.join(', ');

    if (!houseNo.trim() && !streetArea.trim()) {
      Alert.alert('Required Field', 'Please enter flat/house number and street/area address.');
      return;
    }

    if (addAddress) {
      addAddress({
        label: newAddressLabel,
        name: recipientName || name,
        phone: recipientPhone || phone,
        text: fullText
      });
    }

    setUserProfile(prev => ({
      ...prev,
      address: `${newAddressLabel}: ${fullText}`
    }));

    setEditType(null);
    Alert.alert('Address Added', `New delivery address (${newAddressLabel}) saved successfully!`);
  };

  const menuItems = [
    { title: 'My Orders', screen: 'orders' },
    { title: 'Edit Profile Details', action: openEditProfile },
    { title: 'Add New Address', action: openAddNewAddress },
    { title: 'Delivery Addresses', action: openEditAddress },
    { title: 'My Wishlist', action: () => Alert.alert('My Wishlist', 'Your wishlist is currently empty.') },
    { title: 'Payment Methods', action: () => Alert.alert('Payment Methods', 'Default: Cash on Delivery (COD)') },
    { title: 'Notifications', action: () => Alert.alert('Notifications', 'No new notifications.') },
    { title: 'Help & Support', action: () => Alert.alert('Help & Support', 'Contact us at support@salbeau.com') },
    { title: 'About Salbeau', action: () => Alert.alert('About Salbeau', 'Salbeau Beauty Platform v2.4.1') },
  ];

  return (
    <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 100 }} className="bg-gray-50">
      {/* Header Title */}
      <Text className="text-2xl font-black text-slate-900 mb-5 mt-1 tracking-tight">
        Profile
      </Text>

      {/* User Profile Avatar & Info Box Card */}
      <View className="bg-white rounded-2xl border border-gray-200 p-6 mb-5 items-center shadow-xs relative">
        <TouchableOpacity
          onPress={openEditProfile}
          className="absolute top-4 right-4 flex-row items-center gap-1 bg-gray-100 border border-gray-300 px-3 py-1 rounded-xl"
        >
          <Ionicons name="pencil" size={12} color="#1E293B" />
          <Text className="text-[11px] font-bold text-slate-800">Edit</Text>
        </TouchableOpacity>

        {/* Initial Letter Avatar Circle */}
        <View className="w-20 h-20 rounded-2xl bg-gray-900 items-center justify-center mb-3 shadow-xs">
          <Text className="text-3xl font-black text-white">
            {initialLetter}
          </Text>
        </View>

        {/* User Name */}
        <Text className="text-lg font-black text-slate-900 mb-0.5">
          {name}
        </Text>

        {/* Email Address */}
        <Text className="text-xs font-semibold text-slate-500 mb-3">
          {email}
        </Text>

        {/* Role Pill Badge */}
        <View className="bg-gray-100 border border-gray-300 px-4 py-1.5 rounded-xl">
          <Text className="text-[10px] font-black text-slate-800 uppercase tracking-wider">
            {(userRole || 'GENERAL').toUpperCase()} USER
          </Text>
        </View>
      </View>

      {/* Profile Navigation Links Box Card */}
      <View className="bg-white rounded-2xl border border-gray-200 mb-6 overflow-hidden shadow-xs">
        {menuItems.map((item, index) => {
          const isLast = index === menuItems.length - 1;
          return (
            <TouchableOpacity
              key={item.title}
              onPress={() => {
                if (item.screen) {
                  setCurrentScreen(item.screen);
                } else if (item.action) {
                  item.action();
                }
              }}
              className={`flex-row justify-between items-center py-4 px-5 bg-white ${
                !isLast ? 'border-b border-gray-100' : ''
              }`}
            >
              <Text className="text-sm font-extrabold text-slate-900">
                {item.title}
              </Text>
              <Ionicons
                name="arrow-forward"
                size={14}
                color="#64748B"
                style={{ transform: [{ rotate: '-45deg' }] }}
              />
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Logout Button */}
      <TouchableOpacity
        onPress={() => setCurrentScreen('onboarding')}
        className="bg-white border border-gray-300 rounded-xl py-3.5 px-5 items-center flex-row justify-center gap-2 mb-3 shadow-xs"
      >
        <Ionicons name="log-out-outline" size={16} color="#1E293B" />
        <Text className="text-xs font-black text-slate-900 uppercase tracking-wider">
          LOGOUT
        </Text>
      </TouchableOpacity>

      {/* App Version Footer */}
      <Text className="text-center text-xs font-semibold text-slate-400 mb-4">
        Version 2.4.1
      </Text>

      {/* Edit Profile Modal */}
      <Modal
        visible={editType === 'profile'}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setEditType(null)}
      >
        <View className="flex-1 bg-black/40 justify-center items-center p-4">
          <View className="bg-white rounded-2xl border border-gray-200 p-5 w-full max-w-sm shadow-xl">
            <View className="flex-row justify-between items-center mb-4 border-b border-gray-200 pb-2.5">
              <Text className="text-base font-black text-slate-900">Edit Profile Details</Text>
              <TouchableOpacity onPress={() => setEditType(null)}>
                <Ionicons name="close" size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            <Text className="text-[10px] font-black text-slate-500 uppercase mb-2">Full Name</Text>
            <TextInput
              value={editName}
              onChangeText={setEditName}
              className="bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-900 mb-3"
            />

            <Text className="text-[10px] font-black text-slate-500 uppercase mb-2">Email Address</Text>
            <TextInput
              value={editEmail}
              onChangeText={setEditEmail}
              keyboardType="email-address"
              className="bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-900 mb-3"
            />

            <Text className="text-[10px] font-black text-slate-500 uppercase mb-2">Phone Number</Text>
            <TextInput
              value={editPhone}
              onChangeText={setEditPhone}
              keyboardType="phone-pad"
              className="bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-900 mb-4"
            />

            <View className="flex-row gap-2">
              <TouchableOpacity
                onPress={() => setEditType(null)}
                className="flex-1 bg-gray-100 py-2.5 rounded-xl items-center"
              >
                <Text className="text-xs font-bold text-slate-600">Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleSaveProfile}
                className="flex-1 bg-gray-900 py-2.5 rounded-xl items-center shadow-xs"
              >
                <Text className="text-xs font-black text-white">Save Changes</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Edit Delivery Address Modal */}
      <Modal
        visible={editType === 'address'}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setEditType(null)}
      >
        <View className="flex-1 bg-black/40 justify-center items-center p-4">
          <View className="bg-white rounded-2xl border border-gray-200 p-5 w-full max-w-sm shadow-xl">
            <View className="flex-row justify-between items-center mb-4 border-b border-gray-200 pb-2.5">
              <Text className="text-base font-black text-slate-900">Delivery Address</Text>
              <TouchableOpacity onPress={() => setEditType(null)}>
                <Ionicons name="close" size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            <Text className="text-[10px] font-black text-slate-500 uppercase mb-2">Full Shipping Address</Text>
            <TextInput
              multiline
              numberOfLines={3}
              value={editAddressText}
              onChangeText={setEditAddressText}
              className="bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-900 mb-4"
            />

            <View className="flex-row gap-2">
              <TouchableOpacity
                onPress={() => setEditType(null)}
                className="flex-1 bg-gray-100 py-2.5 rounded-xl items-center"
              >
                <Text className="text-xs font-bold text-slate-600">Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleSaveAddress}
                className="flex-1 bg-gray-900 py-2.5 rounded-xl items-center shadow-xs"
              >
                <Text className="text-xs font-black text-white">Save Address</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* FULL SCREEN Add New Address View Modal */}
      <Modal
        visible={editType === 'new_address'}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setEditType(null)}
      >
        <View className="flex-1 bg-gray-50 relative">
          {/* Top Clean Header with Back Button */}
          <View className="bg-white px-4 pt-12 pb-3 border-b border-gray-200 flex-row items-center gap-3 shadow-xs">
            <TouchableOpacity
              onPress={() => setEditType(null)}
              className="w-9 h-9 rounded-xl bg-gray-100 border border-gray-200 items-center justify-center"
            >
              <Ionicons name="chevron-back" size={18} color="#1E293B" />
            </TouchableOpacity>
            <View>
              <Text className="text-base font-black text-slate-900 tracking-tight">Add Delivery Address</Text>
              <Text className="text-[11px] font-medium text-slate-500">Enter complete shipping address details</Text>
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
                  const isSelected = newAddressLabel === item.id;
                  return (
                    <TouchableOpacity
                      key={item.id}
                      onPress={() => setNewAddressLabel(item.id)}
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
                    value={recipientName}
                    onChangeText={setRecipientName}
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
                    value={recipientPhone}
                    onChangeText={setRecipientPhone}
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
                SAVE DELIVERY ADDRESS
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};
