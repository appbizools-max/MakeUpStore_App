import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  ActivityIndicator,
  Animated,
  Easing
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../../context/AppContext';
import { supabase } from '../../config/supabase';

export const CustomerUpiPaymentStatusScreen = () => {
  const {
    currentUpiOrder,
    setCurrentScreen,
    setSelectedOrder,
    orders = [],
    setOrders
  } = useApp();

  const [paymentStatus, setPaymentStatus] = useState('PENDING_VERIFICATION');
  const [verifiedAmount, setVerifiedAmount] = useState(0);
  const [rejectionReason, setRejectionReason] = useState('');
  const [isChecking, setIsChecking] = useState(false);
  const [verifierName, setVerifierName] = useState('');

  // Pulse animation for pending status
  const pulseAnim = useRef(new Animated.Value(1)).current;
  // Scale animation for success checkmark
  const successScaleAnim = useRef(new Animated.Value(0)).current;

  const orderId = currentUpiOrder?.id || (orders && orders[0]?.id) || '';

  // Setup animations
  useEffect(() => {
    if (paymentStatus === 'PENDING_VERIFICATION' || paymentStatus === 'PENDING') {
      const pulseLoop = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.15,
            duration: 1000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true
          })
        ])
      );
      pulseLoop.start();
      return () => pulseLoop.stop();
    } else if (paymentStatus === 'VERIFIED') {
      Animated.spring(successScaleAnim, {
        toValue: 1,
        friction: 5,
        tension: 40,
        useNativeDriver: true
      }).start();
    }
  }, [paymentStatus]);

  // Check and poll order status from Supabase
  const checkOrderStatus = async () => {
    if (!orderId) return;
    try {
      setIsChecking(true);
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('id', orderId)
        .limit(1);

      if (!error && data && data.length > 0) {
        const ord = data[0];
        const ship = ord.shipments || {};
        const upi = ship.upiVerification || {};
        const status = (upi.verificationStatus || ship.paymentStatus || ord.payment_status || 'PENDING_VERIFICATION').toUpperCase();

        setPaymentStatus(status);
        setVerifiedAmount(Number(upi.reportedAmount || upi.expectedAmount || ord.total_amount || 0));
        setRejectionReason(upi.rejectionReason || ship.paymentRejectionReason || '');
        setVerifierName(upi.verifiedByName || ship.verifiedBy || 'Store Administrator');

        // Update local orders list in context
        if (typeof setOrders === 'function') {
          setOrders(prev => (Array.isArray(prev) ? prev : []).map(o => o.id === orderId ? { ...o, shipments: ship } : o));
        }
      }
    } catch (e) {
      console.warn('Status poll note:', e);
    } finally {
      setIsChecking(false);
    }
  };

  // Real-time synchronization via Supabase channel + Polling interval
  useEffect(() => {
    checkOrderStatus();

    // 1. Polling interval every 3 seconds for instant responsiveness
    const interval = setInterval(() => {
      checkOrderStatus();
    }, 3000);

    // 2. Realtime channel subscription
    let channel = null;
    try {
      channel = supabase
        .channel(`order-upi-status-${orderId}`)
        .on(
          'postgres_changes',
          { event: 'UPDATE', schema: 'public', table: 'orders', filter: `id=eq.${orderId}` },
          (payload) => {
            const ord = payload.new;
            if (ord) {
              const ship = ord.shipments || {};
              const upi = ship.upiVerification || {};
              const status = (upi.verificationStatus || ship.paymentStatus || ord.payment_status || 'PENDING_VERIFICATION').toUpperCase();
              setPaymentStatus(status);
              setVerifiedAmount(Number(upi.reportedAmount || upi.expectedAmount || ord.total_amount || 0));
              setRejectionReason(upi.rejectionReason || ship.paymentRejectionReason || '');
            }
          }
        )
        .subscribe();
    } catch (e) { }

    return () => {
      clearInterval(interval);
      if (channel) supabase.removeChannel(channel);
    };
  }, [orderId]);

  const handleContinue = () => {
    if (currentUpiOrder) {
      if (typeof setSelectedOrder === 'function') {
        setSelectedOrder(currentUpiOrder);
      }
      setCurrentScreen('order_details');
    } else {
      setCurrentScreen('orders');
    }
  };

  const handleSwitchToCod = async () => {
    try {
      await supabase
        .from('orders')
        .update({
          payment_method: 'cod',
          shipments: {
            ...(currentUpiOrder?.shipments || {}),
            paymentMethod: 'cash',
            paymentStatus: 'pending'
          }
        })
        .eq('id', orderId);

      setCurrentScreen('orders');
    } catch (e) {
      setCurrentScreen('orders');
    }
  };

  const isVerified = paymentStatus === 'VERIFIED';
  const isRejected = paymentStatus === 'REJECTED';
  const isPending = !isVerified && !isRejected;

  return (
    <View className="flex-1 bg-white">
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Screen Header */}
      <View className="px-5 pt-12 pb-4 flex-row items-center justify-between border-b border-stone-100">
        <View className="flex-row items-center gap-2.5">
          <View className="w-9 h-9 rounded-xl bg-pink-50 items-center justify-center">
            <Ionicons name="shield-checkmark" size={20} color="#C2477A" />
          </View>
          <Text className="text-base font-black text-[#3A2430]">
            UPI Payment Verification
          </Text>
        </View>

        <TouchableOpacity
          onPress={checkOrderStatus}
          disabled={isChecking}
          className="p-2 bg-stone-100 rounded-xl"
        >
          {isChecking ? (
            <ActivityIndicator size="small" color="#C2477A" />
          ) : (
            <Ionicons name="refresh" size={18} color="#553846" />
          )}
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ padding: 24, alignItems: 'center' }} showsVerticalScrollIndicator={false}>
        {/* ============================================================== */}
        {/* 1. STATE: VERIFIED -> ATTRACTIVE GREEN SUCCESS SCREEN           */}
        {/* ============================================================== */}
        {isVerified && (
          <View className="w-full items-center">
            {/* Animated Green Checkmark Indicator */}
            <Animated.View
              style={{
                transform: [{ scale: successScaleAnim }]
              }}
              className="w-24 h-24 rounded-full bg-emerald-50 border-4 border-emerald-400 items-center justify-center mb-5 shadow-lg"
            >
              <View className="w-16 h-16 rounded-full bg-emerald-500 items-center justify-center">
                <Ionicons name="checkmark" size={38} color="#FFFFFF" />
              </View>
            </Animated.View>

            {/* Payment Successful Heading */}
            <Text className="text-2xl font-black text-[#3A2430] text-center mb-1">
              Payment Successful
            </Text>
            <Text className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200 mb-6">
              Verified by Store Administrator
            </Text>

            {/* Verified Details Card */}
            <View className="w-full bg-stone-50 rounded-3xl border border-stone-200/80 p-5 mb-6 space-y-3">
              <View className="flex-row items-center justify-between py-1 border-b border-stone-200/60">
                <Text className="text-xs font-bold text-stone-500">Order ID</Text>
                <Text className="text-xs font-black text-[#C2477A]">#{orderId}</Text>
              </View>

              <View className="flex-row items-center justify-between py-1 border-b border-stone-200/60">
                <Text className="text-xs font-bold text-stone-500">Verified Amount</Text>
                <Text className="text-lg font-black text-emerald-700">₹{verifiedAmount.toLocaleString('en-IN')}</Text>
              </View>

              <View className="flex-row items-center justify-between py-1 border-b border-stone-200/60">
                <Text className="text-xs font-bold text-stone-500">Payment Method</Text>
                <View className="flex-row items-center gap-1">
                  <Ionicons name="qr-code-outline" size={14} color="#7C3AED" />
                  <Text className="text-xs font-black text-purple-900">UPI</Text>
                </View>
              </View>

              <View className="flex-row items-center justify-between py-1">
                <Text className="text-xs font-bold text-stone-500">Verification Status</Text>
                <View className="flex-row items-center gap-1 bg-emerald-100/80 px-2.5 py-0.5 rounded-full">
                  <Ionicons name="checkmark-circle" size={12} color="#059669" />
                  <Text className="text-[11px] font-black text-emerald-800">CONFIRMED</Text>
                </View>
              </View>
            </View>

            {/* Thank you message */}
            <View className="bg-pink-50/70 border border-pink-200/70 rounded-2xl p-4 w-full mb-8 items-center">
              <Ionicons name="heart" size={20} color="#C2477A" style={{ marginBottom: 4 }} />
              <Text className="text-base font-black text-[#C2477A] text-center tracking-tight">
                Thank You for Choosing Salbeau!
              </Text>
              <Text className="text-[11.5px] text-[#8C7078] text-center font-medium mt-1">
                Your luxury beauty order is confirmed and being prepared for fulfillment.
              </Text>
            </View>

            {/* Continue Button */}
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={handleContinue}
              className="w-full py-4 bg-[#C2477A] rounded-2xl items-center justify-center shadow-md active:opacity-90 flex-row gap-2"
            >
              <Text className="text-white font-black text-sm tracking-wide">
                Continue to Order Details
              </Text>
              <Ionicons name="arrow-forward" size={16} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        )}

        {/* ============================================================== */}
        {/* 2. STATE: PENDING_VERIFICATION -> CLEAR AWAITING MESSAGE        */}
        {/* ============================================================== */}
        {isPending && (
          <View className="w-full items-center">
            {/* Pulsing Amber Clock Indicator */}
            <Animated.View
              style={{
                transform: [{ scale: pulseAnim }]
              }}
              className="w-24 h-24 rounded-full bg-amber-50 border-4 border-amber-300 items-center justify-center mb-5"
            >
              <View className="w-16 h-16 rounded-full bg-amber-500 items-center justify-center">
                <Ionicons name="time" size={36} color="#FFFFFF" />
              </View>
            </Animated.View>

            <Text className="text-xl font-black text-[#3A2430] text-center mb-1">
              Payment Awaiting Verification
            </Text>

            {/* Required user-facing notice */}
            <View className="bg-amber-50 border border-amber-200/90 rounded-2xl p-4 w-full my-4">
              <View className="flex-row items-center gap-2 mb-1">
                <Ionicons name="information-circle" size={18} color="#D97706" />
                <Text className="text-xs font-black text-amber-900">
                  Verification in Progress
                </Text>
              </View>
              <Text className="text-xs font-bold text-amber-950 leading-relaxed">
                "Your payment is submitted and is awaiting verification."
              </Text>
              <Text className="text-[11px] text-amber-800 leading-relaxed mt-1">
                Our store administrator is inspecting the payment confirmation receipt and matching transaction reference with bank records.
              </Text>
            </View>

            {/* Order Details Preview */}
            <View className="w-full bg-stone-50 rounded-2xl border border-stone-200/70 p-4 mb-6 space-y-2.5">
              <View className="flex-row items-center justify-between">
                <Text className="text-xs font-bold text-stone-500">Order ID</Text>
                <Text className="text-xs font-black text-stone-800">#{orderId}</Text>
              </View>
              <View className="flex-row items-center justify-between">
                <Text className="text-xs font-bold text-stone-500">Payable Amount</Text>
                <Text className="text-sm font-black text-[#C2477A]">₹{verifiedAmount.toLocaleString('en-IN')}</Text>
              </View>
              <View className="flex-row items-center justify-between">
                <Text className="text-xs font-bold text-stone-500">Payment Mode</Text>
                <Text className="text-xs font-bold text-purple-900">UPI / QR Code</Text>
              </View>

              {/* Live QR Code Display for Customer */}
              <View className="pt-2 border-t border-stone-200 items-center">
                <View className="p-2.5 bg-white rounded-xl border border-purple-200 mb-2">
                  <Image
                    source={{
                      uri: storeSettings?.payments?.upiQrCodeUrl ||
                        `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(
                          `upi://pay?pa=${storeSettings?.payments?.upiId || 'salbeau.store@okaxis'}&pn=Salbeau%20Store&am=${verifiedAmount}&cu=INR`
                        )}`
                    }}
                    style={{ width: 140, height: 140 }}
                    resizeMode="contain"
                  />
                </View>
                <Text className="text-[11px] font-bold text-stone-600">
                  Pay to: <Text className="font-mono text-purple-800 font-black">{storeSettings?.payments?.upiId || 'salbeau.store@okaxis'}</Text>
                </Text>
                <Text className="text-[10px] text-stone-500 mt-0.5">Show receipt to delivery partner upon arrival</Text>
              </View>
            </View>

            <View className="flex-row items-center gap-2 mb-6">
              <ActivityIndicator size="small" color="#C2477A" />
              <Text className="text-xs text-stone-500 font-semibold">
                Auto-refreshing status in real-time...
              </Text>
            </View>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setCurrentScreen('orders')}
              className="w-full py-3.5 bg-stone-200 rounded-2xl items-center justify-center active:opacity-90"
            >
              <Text className="text-stone-700 font-black text-xs">
                View My Orders
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ============================================================== */}
        {/* 3. STATE: REJECTED -> CLEAR EXPLANATION & ALTERNATIVE ACTIONS   */}
        {/* ============================================================== */}
        {isRejected && (
          <View className="w-full items-center">
            <View className="w-20 h-20 rounded-full bg-rose-100 border-4 border-rose-300 items-center justify-center mb-4">
              <Ionicons name="close" size={38} color="#DC2626" />
            </View>

            <Text className="text-xl font-black text-[#3A2430] text-center mb-1">
              Payment Verification Rejected
            </Text>
            <Text className="text-xs font-semibold text-rose-700 bg-rose-50 px-3 py-1 rounded-full border border-rose-200 mb-4">
              Action Required
            </Text>

            <View className="bg-rose-50 border border-rose-200 rounded-2xl p-4 w-full mb-6">
              <Text className="text-xs font-black text-rose-900 mb-1">
                Reason Provided by Administrator:
              </Text>
              <Text className="text-xs text-rose-800 font-medium leading-relaxed">
                {rejectionReason || 'The payment proof receipt could not be verified against bank records.'}
              </Text>
            </View>

            <View className="w-full space-y-3">
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={handleSwitchToCod}
                className="w-full py-3.5 bg-gray-900 rounded-2xl items-center justify-center shadow-sm active:opacity-90 flex-row gap-2"
              >
                <Ionicons name="cash-outline" size={16} color="#FFFFFF" />
                <Text className="text-white font-black text-xs">
                  Switch to Cash on Delivery (COD)
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => setCurrentScreen('orders')}
                className="w-full py-3.5 bg-stone-100 rounded-2xl items-center justify-center"
              >
                <Text className="text-stone-700 font-bold text-xs">
                  Back to Orders
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

