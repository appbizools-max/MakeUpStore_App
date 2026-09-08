import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../../context/AppContext';

export const PlaceOrderScreen = () => {
  const {
    cart,
    userProfile,
    selectedBranch,
    placeOrder,
    setCurrentScreen,
    userRole,
    getRolePrice
  } = useApp();

  const [selectedPayment, setSelectedPayment] = useState('upi');
  const [isSummaryExpanded, setIsSummaryExpanded] = useState(false);
  const [isEditingAddress, setIsEditingAddress] = useState(false);
  const [address, setAddress] = useState(
    userProfile.address || 'Flat 402, Spring Garden Heights, Sector 6, HSR Layout, Bangalore - 560102'
  );
  const [notes, setNotes] = useState('');

  const totalItemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const bagTotal = cart.reduce((sum, item) => {
    const rolePrice = getRolePrice(item.product, userRole);
    return sum + (rolePrice * item.quantity);
  }, 0);

  const discountAmount = 350;
  const totalPayable = Math.max(0, bagTotal - discountAmount);

  const paymentMethods = [
    { id: 'upi', name: 'Unified Payments Interface (UPI)' },
    { id: 'card', name: 'Credit / Debit Card' },
    { id: 'netbanking', name: 'Net Banking' },
    { id: 'cod', name: 'Cash on Delivery (COD)' },
  ];

  const handleConfirmOrder = () => {
    const order = placeOrder({
      deliveryType: 'delivery',
      address,
      branch: selectedBranch,
      paymentMethod: selectedPayment,
      notes,
    });
    Alert.alert('Order Confirmed!', `Order ${order.id} placed successfully!`);
    setCurrentScreen('orders');
  };

  return (
    <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 110 }} className="bg-white">
      {/* Header Row with Back Button & Title */}
      <View className="flex-row items-center gap-3 mb-5 mt-1">
        <TouchableOpacity
          onPress={() => setCurrentScreen('cart')}
          className="w-9 h-9 rounded-full bg-white border border-[#FCE4EC] items-center justify-center shadow-2xs"
        >
          <Ionicons name="chevron-back" size={18} color="#3A2430" />
        </TouchableOpacity>
        <Text className="text-xl font-black text-[#3A2430]">Checkout</Text>
      </View>

      {/* Shipping Address Card */}
      <View className="bg-white rounded-3xl border border-[#FCE4EC] p-4 mb-4 shadow-2xs">
        <View className="flex-row justify-between items-center mb-2">
          <Text className="text-sm font-extrabold text-[#3A2430]">Shipping Address</Text>
          <TouchableOpacity onPress={() => setIsEditingAddress(!isEditingAddress)}>
            <Text className="text-xs font-extrabold text-[#C2477A]">
              {isEditingAddress ? 'SAVE' : 'CHANGE'}
            </Text>
          </TouchableOpacity>
        </View>

        <Text className="text-xs font-bold text-[#3A2430] mb-1">
          {userProfile.name || 'Katty Lopez'}
        </Text>

        {isEditingAddress ? (
          <TextInput
            multiline
            numberOfLines={2}
            value={address}
            onChangeText={setAddress}
            className="w-full px-3 py-2 rounded-xl border border-[#F5A8C0] bg-[#FFF5F8] text-xs font-medium text-[#3A2430] mb-2"
          />
        ) : (
          <Text className="text-xs font-medium text-[#8C7078] leading-relaxed mb-1">
            {address}
          </Text>
        )}

        <Text className="text-xs font-medium text-[#8C7078]">
          Phone: {userProfile.phone || '+91 98765 43210'}
        </Text>
      </View>

      {/* Order Summary Accordion Card */}
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={() => setIsSummaryExpanded(!isSummaryExpanded)}
        className="bg-white rounded-2xl border border-[#FCE4EC] p-3.5 mb-4 flex-row items-center justify-between shadow-2xs"
      >
        <View className="flex-row items-center gap-2.5">
          <Ionicons name="bag-handle-outline" size={17} color="#3A2430" />
          <Text className="text-xs font-bold text-[#3A2430]">
            Order Summary ({totalItemCount} Items)
          </Text>
        </View>
        <Ionicons
          name={isSummaryExpanded ? "chevron-up" : "chevron-down"}
          size={16}
          color="#8C7078"
        />
      </TouchableOpacity>

      {/* Expanded Order Items Preview */}
      {isSummaryExpanded && (
        <View className="bg-[#FFF5F8] border border-[#FCE4EC] rounded-2xl p-3 mb-4 space-y-2">
          {cart.map(({ product, quantity }) => {
            const rolePrice = getRolePrice(product, userRole);
            return (
              <View key={product.id} className="flex-row items-center justify-between py-1">
                <Text className="text-xs font-semibold text-[#3A2430] flex-1" numberOfLines={1}>
                  {product.name} x {quantity}
                </Text>
                <Text className="text-xs font-bold text-[#C2477A] ml-2">₹{rolePrice * quantity}</Text>
              </View>
            );
          })}
        </View>
      )}

      {/* Payment Method Card - Cash on Delivery Only */}
      <View className="bg-white rounded-3xl border border-[#FCE4EC] p-4 mb-4 shadow-2xs">
        <Text className="text-sm font-extrabold text-[#3A2430] mb-3">
          Payment Method
        </Text>

        <View className="bg-[#FFF5F8] border-2 border-[#C2477A] rounded-2xl p-3.5 flex-row items-center justify-between shadow-2xs">
          <View className="flex-row items-center gap-3 flex-1">
            <View className="w-9 h-9 rounded-full bg-white items-center justify-center border border-[#F5A8C0] shadow-2xs">
              <Ionicons name="cash" size={20} color="#C2477A" />
            </View>
            <View className="flex-col flex-1">
              <Text className="text-xs font-extrabold text-[#3A2430]">
                Cash on Delivery (COD)
              </Text>
              <Text className="text-[10px] font-semibold text-[#8C7078] mt-0.5">
                Pay cash upon delivery — No payment gateway
              </Text>
            </View>
          </View>
          <Ionicons name="checkmark-circle" size={22} color="#C2477A" />
        </View>
      </View>

      {/* Payment Totals Breakdown Card */}
      <View className="bg-white rounded-3xl border border-[#FCE4EC] p-4 mb-5 shadow-2xs">
        <View className="space-y-2">
          <View className="flex-row justify-between items-center mb-2">
            <Text className="text-xs font-medium text-[#8C7078]">Item Total</Text>
            <Text className="text-xs font-extrabold text-[#3A2430]">₹{bagTotal}</Text>
          </View>

          <View className="flex-row justify-between items-center mb-2">
            <Text className="text-xs font-medium text-[#8C7078]">Delivery Charges</Text>
            <Text className="text-xs font-extrabold text-[#2E7D32]">FREE</Text>
          </View>

          <View className="flex-row justify-between items-center mb-2">
            <Text className="text-xs font-medium text-[#8C7078]">Discount Applied</Text>
            <Text className="text-xs font-extrabold text-[#2E7D32]">-₹{discountAmount}</Text>
          </View>

          <View className="border-b border-[#FCE4EC] my-1" />

          <View className="flex-row justify-between items-center pt-1">
            <Text className="text-sm font-extrabold text-[#3A2430]">Grand Total</Text>
            <Text className="text-base font-black text-[#C2477A]">₹{totalPayable}</Text>
          </View>
        </View>
      </View>

      {/* Place Order Button */}
      <TouchableOpacity
        onPress={handleConfirmOrder}
        className="bg-[#C2477A] rounded-full py-4 px-6 items-center shadow-lg mb-6 active:opacity-90"
      >
        <Text className="text-sm font-black text-white uppercase tracking-wider">
          PLACE ORDER • ₹{totalPayable}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
};
