import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../../context/AppContext';

export const CartScreen = () => {
  const {
    cart,
    updateCartQuantity,
    removeFromCart,
    userRole,
    getRolePrice,
    setCurrentScreen
  } = useApp();

  const [couponCode, setCouponCode] = useState('');
  const [couponApplied, setCouponApplied] = useState(false);
  const [discountAmount, setDiscountAmount] = useState(350);

  const totalItemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const mrpTotal = cart.reduce((sum, item) => {
    const rolePrice = getRolePrice(item.product, userRole);
    const originalMrp = item.product.mrp > rolePrice ? item.product.mrp : Math.round(item.product.mrp * 1.25);
    return sum + (originalMrp * item.quantity);
  }, 0);

  const bagTotal = cart.reduce((sum, item) => {
    const rolePrice = getRolePrice(item.product, userRole);
    return sum + (rolePrice * item.quantity);
  }, 0);

  const productSavings = Math.max(0, mrpTotal - bagTotal);
  const couponDiscount = couponApplied ? discountAmount : 0;
  const totalSavings = productSavings + couponDiscount;
  const totalPayable = Math.max(0, bagTotal - couponDiscount);

  const handleApplyCoupon = () => {
    if (couponCode.trim().length > 0) {
      setCouponApplied(true);
      setDiscountAmount(350);
    }
  };

  if (cart.length === 0) {
    return (
      <View className="flex-1 bg-white p-6 justify-center items-center">
        <View className="w-16 h-16 rounded-full bg-[#FFF5F8] items-center justify-center border border-[#FCE4EC] mb-4">
          <Ionicons name="bag-handle-outline" size={32} color="#C2477A" />
        </View>
        <Text className="text-lg font-extrabold text-[#3A2430] mb-1">Your Cart is Empty</Text>
        <Text className="text-xs text-[#8C7078] text-center mb-6">Explore our luxury beauty collections and add items to your cart.</Text>
        <TouchableOpacity
          onPress={() => setCurrentScreen('home')}
          className="bg-[#C2477A] px-6 py-3.5 rounded-full shadow-md"
        >
          <Text className="text-xs font-bold text-white uppercase tracking-wider">Explore Products</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-white">
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 110 }} className="bg-white">
        {/* Header Title */}
        <Text className="text-2xl font-black text-[#3A2430] mb-4 mt-1">
          My Cart ({totalItemCount})
        </Text>

        {/* Cart Item Cards */}
        {cart.map(({ product, quantity }) => {
          const rolePrice = getRolePrice(product, userRole);
          const originalMrp = product.mrp > rolePrice ? product.mrp : Math.round(product.mrp * 1.25);
          const shadeText = product.shade || (product.category ? `Category: ${product.category}` : 'Shade: Natural Glow');

          return (
            <View
              key={product.id}
              className="bg-white rounded-3xl border border-[#FCE4EC] p-3 mb-3.5 flex-row items-center gap-3 shadow-2xs"
            >
              {/* Product Image Stage */}
              <View className="w-20 h-20 rounded-2xl overflow-hidden bg-[#FCE4EC] justify-center items-center">
                <Image source={{ uri: product.image }} className="w-full h-full object-cover" />
              </View>

              {/* Product Info & Controls Column */}
              <View className="flex-1">
                {/* Brand Tag */}
                <Text className="text-[9.5px] font-bold text-[#C2477A] uppercase tracking-wider mb-0.5">
                  {product.brandName || 'SALBEAU LUXE'}
                </Text>

                {/* Title */}
                <Text className="text-xs font-bold text-[#3A2430] mb-0.5" numberOfLines={1}>
                  {product.name}
                </Text>

                {/* Shade / Category Subtitle */}
                <Text className="text-[10px] font-medium text-[#8C7078] mb-2">
                  {shadeText}
                </Text>

                {/* Scratched MRP, Discounted Price & Stepper Row */}
                <View className="flex-row items-center justify-between">
                  <View className="flex-col">
                    <Text className="text-[9.5px] font-semibold text-[#8C7078] line-through">
                      MRP ₹{originalMrp}
                    </Text>
                    <Text className="text-sm font-extrabold text-[#C2477A]">
                      ₹{rolePrice}
                    </Text>
                  </View>

                  {/* Non-Overlapping Stepper Pill */}
                  <View className="flex-row items-center border border-[#F5A8C0] rounded-full px-2 py-1 bg-[#FFF5F8] gap-1 shadow-2xs">
                    <TouchableOpacity
                      onPress={() => updateCartQuantity(product.id, quantity - 1)}
                      className="w-6 h-6 rounded-full bg-white items-center justify-center border border-[#FCE4EC]"
                    >
                      <Ionicons name="remove" size={12} color="#C2477A" />
                    </TouchableOpacity>

                    <Text className="text-xs font-extrabold text-[#3A2430] px-2 min-w-[20px] text-center">
                      {quantity}
                    </Text>

                    <TouchableOpacity
                      onPress={() => updateCartQuantity(product.id, quantity + 1)}
                      className="w-6 h-6 rounded-full bg-white items-center justify-center border border-[#FCE4EC]"
                    >
                      <Ionicons name="add" size={12} color="#C2477A" />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </View>
          );
        })}

        {/* Order Payment Details Summary Card */}
        <View className="bg-white rounded-3xl border border-[#FCE4EC] p-4 mb-4 shadow-2xs">
          <Text className="text-sm font-extrabold text-[#3A2430] mb-3">
            Order Payment Details
          </Text>

          <View className="space-y-2">
            <View className="flex-row justify-between items-center mb-2">
              <Text className="text-xs font-medium text-[#8C7078]">MRP Total</Text>
              <Text className="text-xs font-semibold text-[#8C7078] line-through">₹{mrpTotal}</Text>
            </View>

            <View className="flex-row justify-between items-center mb-2">
              <Text className="text-xs font-medium text-[#8C7078]">Tier Discount Savings</Text>
              <Text className="text-xs font-extrabold text-[#2E7D32]">-₹{productSavings}</Text>
            </View>

            {couponApplied && (
              <View className="flex-row justify-between items-center mb-2">
                <Text className="text-xs font-medium text-[#8C7078]">Coupon Discount</Text>
                <Text className="text-xs font-extrabold text-[#2E7D32]">-₹{couponDiscount}</Text>
              </View>
            )}

            <View className="flex-row justify-between items-center mb-2">
              <Text className="text-xs font-medium text-[#8C7078]">Delivery Charges</Text>
              <Text className="text-xs font-extrabold text-[#2E7D32]">FREE</Text>
            </View>

            <View className="border-b border-[#FCE4EC] my-1" />

            <View className="flex-row justify-between items-center pt-1">
              <Text className="text-sm font-extrabold text-[#3A2430]">Total Payable</Text>
              <Text className="text-base font-black text-[#C2477A]">₹{totalPayable}</Text>
            </View>

            {/* Savings Banner Pill */}
            {totalSavings > 0 && (
              <View className="bg-[#FFF5F8] border border-[#FCE4EC] p-2.5 rounded-2xl items-center justify-center mt-3">
                <Text className="text-xs font-extrabold text-[#C2477A]">
                  🎉 You are saving ₹{totalSavings} on this order!
                </Text>
              </View>
            )}
          </View>
        </View>
      </ScrollView>

      {/* Sticky Bottom Action Bar */}
      <View className="absolute bottom-12 left-0 right-0 bg-white border-t border-[#FCE4EC] px-4 py-3 flex-row items-center justify-between shadow-lg">
        <View className="flex-col">
          <Text className="text-[10px] font-bold text-[#8C7078]">Grand Total</Text>
          <Text className="text-base font-black text-[#C2477A]">₹{totalPayable}</Text>
        </View>

        <TouchableOpacity
          onPress={() => setCurrentScreen('checkout')}
          className="bg-[#C2477A] rounded-full py-3.5 px-6 flex-1 ml-4 items-center shadow-md"
        >
          <Text className="text-xs font-extrabold text-white uppercase tracking-wider">
            Proceed to Checkout
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};
