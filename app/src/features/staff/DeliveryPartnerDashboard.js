import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  RefreshControl,
  ActivityIndicator,
  Linking,
  Platform,
  Alert,
  Modal,
  TextInput,
  Image
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../../context/AppContext';
import { supabase } from '../../config/supabase';
import {
  fetchStaffDeliveryOrders,
  acceptOrderDelivery,
  reachPickupLocation,
  startOrderDelivery,
  completeOrderDelivery,
  clearStaffSession,
  submitUpiPaymentProof
} from './staffAuthService';
import { optimizeImage } from '../../utils/imageOptimizer';

export const DeliveryPartnerDashboard = () => {
  const { staffProfile, setStaffProfile, setCurrentScreen, storeSettings } = useApp();

  const [activeTab, setActiveTab] = useState('assigned'); // 'assigned' | 'pending' | 'ongoing' | 'completed'
  const [ordersData, setOrdersData] = useState({ assigned: [], pending: [], ongoing: [], completed: [], all: [] });
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isOnDuty, setIsOnDuty] = useState(true);

  // Delivery & Payment Collection Modal State
  const [deliveryModalOrder, setDeliveryModalOrder] = useState(null);
  const [paymentMode, setPaymentMode] = useState('cash'); // 'cash' | 'upi'
  const [cashAmount, setCashAmount] = useState('');
  const [upiUtr, setUpiUtr] = useState('');
  const [deliveryNote, setDeliveryNote] = useState('');
  // Dedicated UPI Payment Proof Verification Modal State
  const [upiModalOrder, setUpiModalOrder] = useState(null);
  const [upiReportedAmount, setUpiReportedAmount] = useState('');
  const [upiProofUtr, setUpiProofUtr] = useState('');
  const [upiProofImage, setUpiProofImage] = useState(null);
  const [upiProofUrl, setUpiProofUrl] = useState('');
  const [upiNotes, setUpiNotes] = useState('');
  const [isUploadingProof, setIsUploadingProof] = useState(false);
  const [isPaymentConfirmedByStaff, setIsPaymentConfirmedByStaff] = useState(true);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  // Expanded Order items toggle state
  const [expandedOrders, setExpandedOrders] = useState({});

  const toggleOrderExpand = (id) => {
    setExpandedOrders(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const loadOrders = useCallback(async (showSpinner = false) => {
    if (showSpinner) setIsLoading(true);
    try {
      const result = await fetchStaffDeliveryOrders(staffProfile);
      setOrdersData(result);
    } catch (err) {
      console.warn('Error loading delivery partner orders:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [staffProfile]);

  useEffect(() => {
    loadOrders(true);

    // Instant real-time listener on orders table
    const channel = supabase
      .channel(`staff-deliveries-${staffProfile?.id || 'live'}-${Date.now()}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {
        loadOrders(false);
      })
      .subscribe();

    // Periodic real-time poll fallback every 25 seconds
    const interval = setInterval(() => {
      loadOrders(false);
    }, 25000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(interval);
    };
  }, [loadOrders, staffProfile?.id]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    loadOrders(false);
  };

  // Staff Logout
  const handleLogout = () => {
    Alert.alert(
      'Log Out Delivery Shift',
      'Are you sure you want to log out of your delivery partner session?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Log Out',
          style: 'destructive',
          onPress: async () => {
            await clearStaffSession();
            if (setStaffProfile) setStaffProfile(null);
            setCurrentScreen('login');
          }
        }
      ]
    );
  };

  // Action: Accept Delivery Task
  const handleAcceptOrder = async (order) => {
    if (!order || !order.id) return;
    setIsLoading(true);
    const success = await acceptOrderDelivery(order.id, staffProfile);
    if (success) {
      await loadOrders(false);
      Alert.alert('Order Accepted 👍', `Order #${order.id} has been accepted. Proceed to pickup location.`);
    } else {
      Alert.alert('Update Failed', 'Unable to record order acceptance in database.');
    }
    setIsLoading(false);
  };

  // Action: Record Reached Store / Pickup Location
  const handleReachPickup = async (order) => {
    if (!order || !order.id) return;
    setIsLoading(true);
    const success = await reachPickupLocation(order.id, staffProfile);
    if (success) {
      await loadOrders(false);
      Alert.alert('Reached Pickup Store 📍', `Recorded reached store location for order #${order.id}.`);
    } else {
      Alert.alert('Update Failed', 'Unable to record pickup arrival in database.');
    }
    setIsLoading(false);
  };

  // Action 1: Start Delivery / Pick up from Store (Captures Started Time)
  const handleStartDelivery = async (order) => {
    if (!order || !order.id) return;

    Alert.alert(
      'Start Delivery',
      `Pick up package #${order.id} and start delivery route? Started time will be recorded.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Yes, Start Delivery',
          onPress: async () => {
            setIsLoading(true);
            const success = await startOrderDelivery(order.id, staffProfile);
            if (success) {
              await loadOrders(false);
              setActiveTab('ongoing');
              Alert.alert('Delivery Started 🚀', `Order #${order.id} is now Out for Delivery. Started time recorded.`);
            } else {
              Alert.alert('Update Failed', 'Unable to update status in database. Please check your network.');
            }
            setIsLoading(false);
          }
        }
      ]
    );
  };

  // Action: Open Dedicated UPI Payment Verification Modal
  const handleOpenUpiVerificationModal = (order) => {
    setUpiModalOrder(order);
    const amount = Number(order.total_amount || order.total || 0);
    setUpiReportedAmount(String(amount));
    setUpiProofUtr('');
    setUpiProofImage(null);
    setUpiProofUrl('');
    setUpiNotes('');
  };

  // Action: Capture photograph of payment confirmation with HD compression
  const handlePickProofPhoto = () => {
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.capture = 'environment';
      input.onchange = async (e) => {
        const file = e.target.files && e.target.files[0];
        if (!file) return;
        try {
          setIsUploadingProof(true);
          const optimized = await optimizeImage(file, 'VERIFICATION_DOC');
          setUpiProofImage(optimized.dataUrl);
          setUpiProofUrl(optimized.dataUrl);
        } catch (err) {
          console.warn('Error compressing photo:', err);
          Alert.alert('Optimization Error', 'Could not compress image. Please retry.');
        } finally {
          setIsUploadingProof(false);
        }
      };
      input.click();
    } else {
      Alert.alert('Camera Capture', 'Please capture or attach the UPI receipt photograph.');
    }
  };

  // Action: Submit UPI Payment Proof for Admin Verification
  const handleSubmitUpiVerification = async () => {
    if (!upiModalOrder || isUploadingProof) return;
    if (!upiProofImage && !upiProofUrl) {
      Alert.alert('Receipt Photograph Required', 'Please capture or upload a clear photo of the customer UPI transaction receipt.');
      return;
    }

    setIsUploadingProof(true);
    try {
      const res = await submitUpiPaymentProof(upiModalOrder.id, staffProfile, {
        reportedAmount: Number(upiReportedAmount || upiModalOrder.total_amount || 0),
        upiUtr: upiProofUtr.trim(),
        proofBase64: upiProofImage,
        proofUrl: upiProofUrl,
        notes: upiNotes.trim()
      });

      if (res.success) {
        setUpiModalOrder(null);
        await loadOrders(false);
        Alert.alert(
          'Payment Proof Submitted! 📸',
          `Payment verification record created for Order #${upiModalOrder.id}.\nPayment Status: PENDING VERIFICATION.\n\nStore Administrator will inspect the proof photo and confirm the transaction.`
        );
      } else {
        Alert.alert('Submission Error', res.error || 'Failed to submit payment proof.');
      }
    } catch (err) {
      Alert.alert('Error', err.message || 'An unexpected error occurred.');
    } finally {
      setIsUploadingProof(false);
    }
  };

    // Action 2: Open Modal to Mark Delivered & Collect Payment (Cash COD or UPI)
  const handleOpenDeliverModal = (order) => {
    setDeliveryModalOrder(order);
    const amount = Number(order.total_amount || order.total || 0);
    setCashAmount(String(amount));
    setPaymentMode('cash');
    setUpiUtr('');
    setDeliveryNote('');
    setIsPaymentConfirmedByStaff(true);
  };

  // Action 3: Confirm Delivery & Payment Collection in Database
  const handleConfirmDelivery = async () => {
    if (!deliveryModalOrder || isUpdatingStatus) return;

    if (!isPaymentConfirmedByStaff) {
      Alert.alert('Payment Confirmation Required', 'Please confirm that payment has been received before completing delivery.');
      return;
    }

    if (paymentMode === 'upi' && !upiUtr.trim()) {
      Alert.alert('UPI Reference Required', 'Please enter the 12-digit UPI UTR number or transaction reference from the customer payment screen.');
      return;
    }

    setIsUpdatingStatus(true);
    try {
      const amount = Number(deliveryModalOrder.total_amount || deliveryModalOrder.total || 0);
      const success = await completeOrderDelivery(deliveryModalOrder.id, staffProfile, {
        paymentMethod: paymentMode,
        paymentAmount: amount,
        upiUtr: upiUtr.trim(),
        notes: deliveryNote.trim()
      });

      if (success) {
        setDeliveryModalOrder(null);
        await loadOrders(false);
        setActiveTab('completed');
        Alert.alert(
          'Delivery Completed! 🎉',
          `Order #${deliveryModalOrder.id} marked as Delivered.\nPayment: ₹${amount.toLocaleString('en-IN')} via ${paymentMode.toUpperCase()}.\nSynced with Admin Panel.`
        );
      } else {
        Alert.alert('Error', 'Unable to complete order delivery in database.');
      }
    } catch (e) {
      console.warn('Delivery completion error:', e);
      Alert.alert('Error', 'An unexpected error occurred while completing delivery.');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  // Quick Action: Call Customer
  const handleCallCustomer = (phone) => {
    if (!phone) {
      Alert.alert('No Phone', 'Customer phone number is not available.');
      return;
    }
    const clean = phone.replace(/[^\d+]/g, '');
    Linking.openURL(`tel:${clean}`).catch(() => {
      Alert.alert('Error', 'Unable to open phone dialer.');
    });
  };

  // Quick Action: Open Maps Directions
  const handleOpenMaps = (address) => {
    if (!address) {
      Alert.alert('No Address', 'Delivery address is not available.');
      return;
    }
    const query = encodeURIComponent(address);
    const url = Platform.select({
      ios: `maps:0,0?q=${query}`,
      android: `geo:0,0?q=${query}`,
      default: `https://www.google.com/maps/search/?api=1&query=${query}`
    });
    Linking.openURL(url).catch(() => {
      Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${query}`);
    });
  };

  const currentTabOrders = ordersData[activeTab] || [];
  const modalOrderAmount = deliveryModalOrder ? Number(deliveryModalOrder.total_amount || deliveryModalOrder.total || 0) : 0;
  const storeUpiId = storeSettings?.payments?.upiId || 'salbeau.store@okaxis';
  const storeName = storeSettings?.storeName || storeSettings?.identity?.storeName || 'Salbeau MakeUpStore';
  const customMerchantQrUrl = storeSettings?.payments?.upiQrCodeUrl;
  const upiPayString = deliveryModalOrder
    ? `upi://pay?pa=${encodeURIComponent(storeUpiId)}&pn=${encodeURIComponent(storeName)}&am=${modalOrderAmount}&cu=INR&tn=Order%20${deliveryModalOrder.id}`
    : `upi://pay?pa=${encodeURIComponent(storeUpiId)}&pn=${encodeURIComponent(storeName)}&cu=INR`;
  const dynamicQrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(upiPayString)}`;
  const displayQrImageUrl = customMerchantQrUrl || dynamicQrImageUrl;

  return (
    <View className="flex-1 bg-stone-50">
      <StatusBar barStyle="light-content" backgroundColor="#1E141A" />

      {/* ── TOP LUXURY STAFF HEADER BAR ── */}
      <View className="bg-[#1E141A] pt-4 pb-5 px-5">
        <View className="flex-row items-center justify-between mb-3">
          {/* Staff Identity & Role */}
          <View className="flex-row items-center flex-1 mr-3">
            <View className="w-12 h-12 rounded-2xl bg-[#D81B60] items-center justify-center mr-3 border border-pink-300/30">
              <Ionicons name="bicycle" size={24} color="#FFFFFF" />
            </View>

            <View className="flex-1">
              <View className="flex-row items-center gap-1.5">
                <Text className="text-white font-black text-base" numberOfLines={1}>
                  {staffProfile?.name || 'Ravi Kumar'}
                </Text>
                {/* On Duty Indicator */}
                <View className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
              </View>
              <Text className="text-pink-200 text-xs font-semibold">
                {staffProfile?.designation || 'Delivery Partner'} • {staffProfile?.employeeCode || 'EMP-DEL-01'}
              </Text>
            </View>
          </View>

          {/* Header Action Buttons */}
          <View className="flex-row items-center gap-2">
            {/* Sync Refresh Button */}
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={handleRefresh}
              className="w-9 h-9 rounded-full bg-white/10 items-center justify-center border border-white/10"
            >
              <Ionicons name="refresh" size={17} color="#FFFFFF" />
            </TouchableOpacity>

            {/* Logout Button */}
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={handleLogout}
              className="w-9 h-9 rounded-full bg-red-500/20 items-center justify-center border border-red-500/30"
            >
              <Ionicons name="log-out-outline" size={18} color="#FF6B8B" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Business-Wise Store Mapping Pill */}
        <View className="flex-row items-center justify-between bg-white/10 px-3.5 py-2 rounded-xl border border-white/10">
          <View className="flex-row items-center flex-1 mr-2">
            <Ionicons name="business" size={14} color="#F5A8C0" style={{ marginRight: 6 }} />
            <Text className="text-white text-xs font-bold" numberOfLines={1}>
              Store: {staffProfile?.branch || staffProfile?.workLocation || 'Unassigned Branch'}
            </Text>
          </View>

          {/* Duty Toggle Pill */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => setIsOnDuty(!isOnDuty)}
            className={`px-2.5 py-0.5 rounded-full flex-row items-center gap-1 ${isOnDuty ? 'bg-emerald-500/20 border border-emerald-400/40' : 'bg-stone-500/30 border border-stone-400/30'}`}
          >
            <View className={`w-1.5 h-1.5 rounded-full ${isOnDuty ? 'bg-emerald-400' : 'bg-stone-400'}`} />
            <Text className={`text-[10px] font-black uppercase ${isOnDuty ? 'text-emerald-300' : 'text-stone-300'}`}>
              {isOnDuty ? 'On Duty' : 'On Break'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* ── 4 TABS SELECTOR (ASSIGNED, PENDING, ONGOING, COMPLETED) ── */}
      <View className="bg-white border-b border-stone-200 shadow-2xs">
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row px-3 py-2.5">
          {/* Tab 1: Assigned */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => setActiveTab('assigned')}
            className={`flex-row items-center px-4 py-2 rounded-full mr-2 border ${
              activeTab === 'assigned'
                ? 'bg-[#D81B60] border-[#D81B60]'
                : 'bg-stone-100 border-stone-200'
            }`}
          >
            <Ionicons
              name="clipboard-outline"
              size={15}
              color={activeTab === 'assigned' ? '#FFFFFF' : '#553846'}
              style={{ marginRight: 5 }}
            />
            <Text className={`text-xs font-black ${activeTab === 'assigned' ? 'text-white' : 'text-[#553846]'}`}>
              Assigned
            </Text>
            <View className={`ml-2 px-1.5 py-0.5 rounded-full ${activeTab === 'assigned' ? 'bg-white/25' : 'bg-stone-200'}`}>
              <Text className={`text-[10px] font-black ${activeTab === 'assigned' ? 'text-white' : 'text-stone-700'}`}>
                {ordersData.assigned.length}
              </Text>
            </View>
          </TouchableOpacity>

          {/* Tab 2: Pending */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => setActiveTab('pending')}
            className={`flex-row items-center px-4 py-2 rounded-full mr-2 border ${
              activeTab === 'pending'
                ? 'bg-[#D81B60] border-[#D81B60]'
                : 'bg-stone-100 border-stone-200'
            }`}
          >
            <Ionicons
              name="time-outline"
              size={15}
              color={activeTab === 'pending' ? '#FFFFFF' : '#553846'}
              style={{ marginRight: 5 }}
            />
            <Text className={`text-xs font-black ${activeTab === 'pending' ? 'text-white' : 'text-[#553846]'}`}>
              Pending
            </Text>
            <View className={`ml-2 px-1.5 py-0.5 rounded-full ${activeTab === 'pending' ? 'bg-white/25' : 'bg-stone-200'}`}>
              <Text className={`text-[10px] font-black ${activeTab === 'pending' ? 'text-white' : 'text-stone-700'}`}>
                {ordersData.pending.length}
              </Text>
            </View>
          </TouchableOpacity>

          {/* Tab 3: Ongoing / In Transit */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => setActiveTab('ongoing')}
            className={`flex-row items-center px-4 py-2 rounded-full mr-2 border ${
              activeTab === 'ongoing'
                ? 'bg-[#D81B60] border-[#D81B60]'
                : 'bg-stone-100 border-stone-200'
            }`}
          >
            <Ionicons
              name="bicycle"
              size={16}
              color={activeTab === 'ongoing' ? '#FFFFFF' : '#553846'}
              style={{ marginRight: 5 }}
            />
            <Text className={`text-xs font-black ${activeTab === 'ongoing' ? 'text-white' : 'text-[#553846]'}`}>
              Ongoing
            </Text>
            <View className={`ml-2 px-1.5 py-0.5 rounded-full ${activeTab === 'ongoing' ? 'bg-white/25' : 'bg-stone-200'}`}>
              <Text className={`text-[10px] font-black ${activeTab === 'ongoing' ? 'text-white' : 'text-stone-700'}`}>
                {ordersData.ongoing.length}
              </Text>
            </View>
          </TouchableOpacity>

          {/* Tab 4: Completed */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => setActiveTab('completed')}
            className={`flex-row items-center px-4 py-2 rounded-full mr-3 border ${
              activeTab === 'completed'
                ? 'bg-[#D81B60] border-[#D81B60]'
                : 'bg-stone-100 border-stone-200'
            }`}
          >
            <Ionicons
              name="checkmark-done"
              size={15}
              color={activeTab === 'completed' ? '#FFFFFF' : '#553846'}
              style={{ marginRight: 5 }}
            />
            <Text className={`text-xs font-black ${activeTab === 'completed' ? 'text-white' : 'text-[#553846]'}`}>
              Completed
            </Text>
            <View className={`ml-2 px-1.5 py-0.5 rounded-full ${activeTab === 'completed' ? 'bg-white/25' : 'bg-stone-200'}`}>
              <Text className={`text-[10px] font-black ${activeTab === 'completed' ? 'text-white' : 'text-stone-700'}`}>
                {ordersData.completed.length}
              </Text>
            </View>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* ── ORDERS FEED LIST ── */}
      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 60 }}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} colors={['#D81B60']} />}
      >
        {isLoading ? (
          <View className="py-20 items-center justify-center">
            <ActivityIndicator size="large" color="#D81B60" />
            <Text className="text-xs font-bold text-stone-500 mt-3">Loading deliveries...</Text>
          </View>
        ) : currentTabOrders.length === 0 ? (
          <View className="py-16 items-center justify-center px-6">
            <View className="w-16 h-16 rounded-full bg-pink-50 items-center justify-center mb-3 border border-pink-100">
              <Ionicons
                name={
                  activeTab === 'assigned'
                    ? 'clipboard-outline'
                    : activeTab === 'pending'
                    ? 'time-outline'
                    : activeTab === 'ongoing'
                    ? 'bicycle-outline'
                    : 'checkmark-circle-outline'
                }
                size={32}
                color="#D81B60"
              />
            </View>
            <Text className="text-base font-black text-[#3A2430] text-center">
              No {activeTab} deliveries
            </Text>
            <Text className="text-xs text-stone-500 text-center mt-1 leading-relaxed max-w-[260px]">
              {activeTab === 'assigned'
                ? 'No packages currently assigned for dispatch at your store.'
                : activeTab === 'pending'
                ? 'No pending orders waiting for pickup.'
                : activeTab === 'ongoing'
                ? 'You do not have any active out-for-delivery packages right now.'
                : 'Completed orders for this shift will appear here.'}
            </Text>
          </View>
        ) : (
          currentTabOrders.map((order) => {
            const isExpanded = Boolean(expandedOrders[order.id]);
            const items = Array.isArray(order.items) ? order.items : [];
            const customerName = order.user_name || order.userName || 'Customer';
            const customerPhone = order.phone || '';
            const isB2B = (order.user_role && order.user_role !== 'general') || (order.userRole && order.userRole !== 'general');
            const deliveryAddress = order.delivery_address || order.deliveryAddress || 'Store Pickup / Counter';
            const totalAmount = Number(order.total_amount || order.total || 0);

            const parsedShip = (order.shipments && typeof order.shipments === 'object') ? order.shipments : {};
            const startedAtFormatted = parsedShip.startedAt ? new Date(parsedShip.startedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : null;
            const deliveredAtFormatted = parsedShip.deliveredAt ? new Date(parsedShip.deliveredAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : null;
            const paidMethod = parsedShip.paymentMethod || order.payment_method || 'cash';

            return (
              <View
                key={order.id}
                className="bg-white rounded-2xl p-4 mb-4 border border-stone-200 shadow-2xs"
              >
                {/* Order Top Bar with B2C/B2B Tag */}
                <View className="flex-row items-center justify-between pb-3 border-b border-stone-100">
                  <View className="flex-row items-center gap-2">
                    <Text className="text-xs font-black text-[#D81B60]">
                      #{order.id}
                    </Text>
                    {/* B2B vs B2C Badge */}
                    <View className={`px-2 py-0.5 rounded-full ${isB2B ? 'bg-purple-100' : 'bg-pink-100'}`}>
                      <Text className={`text-[9.5px] font-black uppercase ${isB2B ? 'text-purple-700' : 'text-[#D81B60]'}`}>
                        {isB2B ? (order.user_role || order.userRole || 'B2B Trade') : 'B2C Retail'}
                      </Text>
                    </View>
                  </View>

                  {/* Status Badge */}
                  <View
                    className={`px-2.5 py-1 rounded-full flex-row items-center gap-1 ${
                      activeTab === 'completed'
                        ? 'bg-emerald-50 border border-emerald-200'
                        : activeTab === 'ongoing'
                        ? 'bg-blue-50 border border-blue-200'
                        : 'bg-amber-50 border border-amber-200'
                    }`}
                  >
                    <Ionicons
                      name={
                        activeTab === 'completed'
                          ? 'checkmark-circle'
                          : activeTab === 'ongoing'
                          ? 'bicycle'
                          : 'time'
                      }
                      size={12}
                      color={
                        activeTab === 'completed'
                          ? '#059669'
                          : activeTab === 'ongoing'
                          ? '#2563EB'
                          : '#D97706'
                      }
                    />
                    <Text
                      className={`text-[10.5px] font-black uppercase ${
                        activeTab === 'completed'
                          ? 'text-emerald-700'
                          : activeTab === 'ongoing'
                          ? 'text-blue-700'
                          : 'text-amber-700'
                      }`}
                    >
                      {(order.status || 'placed').replace(/_/g, ' ')}
                    </Text>
                  </View>
                </View>

                {/* Customer Details & Actions */}
                <View className="py-3">
                  <View className="flex-row items-center justify-between mb-1">
                    <View className="flex-row items-center flex-1 mr-2">
                      <Ionicons name="person-outline" size={14} color="#553846" style={{ marginRight: 5 }} />
                      <Text className="text-sm font-bold text-[#3A2430]" numberOfLines={1}>
                        {customerName}
                      </Text>
                    </View>

                    {/* Quick Call Action */}
                    {customerPhone ? (
                      <TouchableOpacity
                        activeOpacity={0.8}
                        onPress={() => handleCallCustomer(customerPhone)}
                        className="flex-row items-center bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full"
                      >
                        <Ionicons name="call" size={12} color="#059669" style={{ marginRight: 4 }} />
                        <Text className="text-xs font-bold text-emerald-700">Call</Text>
                      </TouchableOpacity>
                    ) : null}
                  </View>

                  {/* Delivery Address & Maps Button */}
                  <View className="flex-row items-start justify-between mt-2 bg-stone-50 p-2.5 rounded-xl border border-stone-200/80">
                    <View className="flex-row items-start flex-1 mr-2">
                      <Ionicons name="location-outline" size={15} color="#D81B60" style={{ marginRight: 4, marginTop: 2 }} />
                      <Text className="text-xs font-semibold text-[#553846] leading-relaxed flex-1">
                        {deliveryAddress}
                      </Text>
                    </View>

                    <TouchableOpacity
                      activeOpacity={0.8}
                      onPress={() => handleOpenMaps(deliveryAddress)}
                      className="px-2.5 py-1 bg-white border border-stone-300 rounded-lg flex-row items-center"
                    >
                      <Ionicons name="navigate-outline" size={12} color="#2563EB" style={{ marginRight: 3 }} />
                      <Text className="text-[11px] font-bold text-blue-600">Maps</Text>
                    </TouchableOpacity>
                  </View>

                  {/* Timings Badge if available (Started Time & Delivery Time) */}
                  {(startedAtFormatted || deliveredAtFormatted) && (
                    <View className="flex-row items-center gap-3 mt-2.5 px-1">
                      {startedAtFormatted && (
                        <View className="flex-row items-center">
                          <Ionicons name="play-circle-outline" size={13} color="#2563EB" style={{ marginRight: 3 }} />
                          <Text className="text-[11px] font-bold text-stone-600">
                            Started: <Text className="text-blue-700">{startedAtFormatted}</Text>
                          </Text>
                        </View>
                      )}
                      {deliveredAtFormatted && (
                        <View className="flex-row items-center">
                          <Ionicons name="checkmark-circle-outline" size={13} color="#059669" style={{ marginRight: 3 }} />
                          <Text className="text-[11px] font-bold text-stone-600">
                            Delivered: <Text className="text-emerald-700">{deliveredAtFormatted}</Text>
                          </Text>
                        </View>
                      )}
                    </View>
                  )}

                  {/* Payment & Total Amount Bar */}
                  <View className="flex-row items-center justify-between mt-3 pt-2 border-t border-stone-100">
                    <View className="flex-row items-center">
                      <Text className="text-xs font-medium text-stone-500 mr-2">Payment:</Text>
                      <View className={`px-2 py-0.5 rounded-md ${paidMethod === 'upi' ? 'bg-purple-100' : 'bg-amber-100'}`}>
                        <Text className={`text-[10px] font-black uppercase ${paidMethod === 'upi' ? 'text-purple-800' : 'text-amber-800'}`}>
                          {paidMethod === 'upi' ? 'UPI / QR Code' : 'Cash (COD)'}
                        </Text>
                      </View>
                    </View>

                    <Text className="text-base font-black text-[#3A2430]">
                      ₹{totalAmount.toLocaleString('en-IN')}
                    </Text>
                  </View>
                </View>

                {/* Expand Items Toggle */}
                {items.length > 0 && (
                  <View className="border-t border-stone-100 pt-2">
                    <TouchableOpacity
                      activeOpacity={0.7}
                      onPress={() => toggleOrderExpand(order.id)}
                      className="flex-row items-center justify-between py-1"
                    >
                      <Text className="text-xs font-bold text-stone-500">
                        {isExpanded ? 'Hide Items' : `View ${items.length} Order Item(s)`}
                      </Text>
                      <Ionicons name={isExpanded ? 'chevron-up' : 'chevron-down'} size={14} color="#8C7078" />
                    </TouchableOpacity>

                    {/* Expandable Items List */}
                    {isExpanded && (
                      <View className="mt-2 bg-stone-50 p-2.5 rounded-xl border border-stone-200">
                        {items.map((it, idx) => (
                          <View key={idx} className="flex-row justify-between py-1 border-b border-stone-200/50 last:border-b-0">
                            <Text className="text-xs font-semibold text-stone-700 flex-1 mr-2" numberOfLines={1}>
                              {it.quantity || it.qty || 1}x {it.name || it.title || 'Product'} {it.shadeName ? `(${it.shadeName})` : ''}
                            </Text>
                            <Text className="text-xs font-bold text-stone-800">
                              ₹{(Number(it.price || it.mrp || 0) * (it.quantity || it.qty || 1)).toLocaleString('en-IN')}
                            </Text>
                          </View>
                        ))}
                      </View>
                    )}
                  </View>
                )}

                {/* ── CARD BOTTOM ACTION BUTTONS ── */}
                <View className="mt-3 pt-3 border-t border-stone-100">
                  {/* Status is Assigned / Ready for pickup */}
                  {(activeTab === 'assigned' || activeTab === 'pending') && (
                    <View className="flex-row items-center gap-2">
                      {order.status !== 'accepted' && order.status !== 'reached_pickup' && (
                        <TouchableOpacity
                          activeOpacity={0.8}
                          onPress={() => handleAcceptOrder(order)}
                          className="flex-1 py-2.5 bg-pink-50 border border-pink-200 rounded-xl flex-row items-center justify-center shadow-xs"
                        >
                          <Ionicons name="checkmark-circle-outline" size={15} color="#D81B60" style={{ marginRight: 5 }} />
                          <Text className="text-[#D81B60] font-bold text-xs">
                            Accept Order
                          </Text>
                        </TouchableOpacity>
                      )}

                      {order.status === 'accepted' && (
                        <TouchableOpacity
                          activeOpacity={0.8}
                          onPress={() => handleReachPickup(order)}
                          className="flex-1 py-2.5 bg-blue-50 border border-blue-200 rounded-xl flex-row items-center justify-center shadow-xs"
                        >
                          <Ionicons name="location-outline" size={15} color="#2563EB" style={{ marginRight: 5 }} />
                          <Text className="text-blue-700 font-bold text-xs">
                            Reached Store
                          </Text>
                        </TouchableOpacity>
                      )}

                      <TouchableOpacity
                        activeOpacity={0.9}
                        onPress={() => handleStartDelivery(order)}
                        className="flex-1 py-2.5 bg-[#D81B60] rounded-xl flex-row items-center justify-center shadow-xs active:opacity-90"
                      >
                        <Ionicons name="bicycle" size={16} color="#FFFFFF" style={{ marginRight: 5 }} />
                        <Text className="text-white font-black text-xs tracking-wide">
                          Pick Up & Start
                        </Text>
                      </TouchableOpacity>
                    </View>
                  )}

                  {/* Status is Ongoing (Out for Delivery) */}
                  {activeTab === 'ongoing' && (
                    <TouchableOpacity
                      activeOpacity={0.9}
                      onPress={() => handleOpenDeliverModal(order)}
                      className="w-full py-3 bg-emerald-600 rounded-xl flex-row items-center justify-center shadow-xs active:opacity-90"
                    >
                      <Ionicons name="card-outline" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
                      <Text className="text-white font-black text-xs tracking-wide">
                        Mark Delivered & Collect Payment (Cash / UPI)
                      </Text>
                    </TouchableOpacity>
                  )}

                  {/* Status is Completed */}
                  {activeTab === 'completed' && (
                    <View className="flex-row items-center justify-center py-1">
                      <Ionicons name="checkmark-done-circle" size={16} color="#059669" style={{ marginRight: 4 }} />
                      <Text className="text-xs font-bold text-emerald-700">
                        Delivered & Payment Confirmed by {order.assigned_employee_name || staffProfile?.name || 'Rider'}
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            );
          })
        )}
      </ScrollView>

      {/* ── DEDICATED UPI PAYMENT VERIFICATION MODAL ── */}
      <Modal
        visible={Boolean(upiModalOrder)}
        transparent
        animationType="slide"
        onRequestClose={() => setUpiModalOrder(null)}
      >
        <View className="flex-1 bg-black/60 justify-end">
          <View className="bg-white rounded-t-3xl p-5 max-h-[92%]">
            <View className="flex-row items-center justify-between pb-3 border-b border-stone-100 mb-3">
              <View className="flex-row items-center gap-2">
                <View className="w-8 h-8 rounded-full bg-purple-100 items-center justify-center">
                  <Ionicons name="shield-checkmark" size={18} color="#7C3AED" />
                </View>
                <Text className="text-base font-black text-[#3A2430]">
                  UPI Payment Verification
                </Text>
              </View>

              <TouchableOpacity onPress={() => setUpiModalOrder(null)}>
                <Ionicons name="close-circle" size={24} color="#8C7078" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {upiModalOrder && (
                <View className="mb-4">
                  {/* Order & Customer Summary */}
                  <View className="bg-purple-50/60 p-3.5 rounded-2xl border border-purple-200 mb-3">
                    <View className="flex-row items-center justify-between">
                      <Text className="text-xs font-bold text-purple-900">
                        Order #{upiModalOrder.id}
                      </Text>
                      <Text className="text-xs font-black text-[#D81B60]">
                        Expected: ₹{Number(upiModalOrder.total_amount || 0).toLocaleString('en-IN')}
                      </Text>
                    </View>
                    <Text className="text-sm font-black text-[#3A2430] mt-1">
                      Customer: {upiModalOrder.user_name || 'Customer'}
                    </Text>
                  </View>

                  {/* Amount Received Input */}
                  <View className="mb-3">
                    <Text className="text-xs font-bold text-stone-700 mb-1">
                      Confirmed Amount Received (₹) *
                    </Text>
                    <TextInput
                      keyboardType="numeric"
                      value={upiReportedAmount}
                      onChangeText={setUpiReportedAmount}
                      placeholder="Enter amount transferred"
                      placeholderTextColor="#A8929A"
                      className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3.5 py-2.5 text-xs font-bold text-stone-800"
                    />
                  </View>

                  {/* UPI Reference (UTR) Input */}
                  <View className="mb-3">
                    <Text className="text-xs font-bold text-stone-700 mb-1">
                      UPI Reference / UTR Number (Optional/Recommended)
                    </Text>
                    <TextInput
                      value={upiProofUtr}
                      onChangeText={setUpiProofUtr}
                      placeholder="e.g. 412356789012"
                      placeholderTextColor="#A8929A"
                      className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3.5 py-2.5 text-xs font-bold text-stone-800"
                    />
                  </View>

                  {/* Photograph Capture Section */}
                  <View className="mb-4">
                    <Text className="text-xs font-bold text-stone-700 mb-1.5">
                      Capture Payment Confirmation Receipt *
                    </Text>

                    {upiProofImage ? (
                      <View className="relative bg-stone-100 rounded-2xl overflow-hidden border border-purple-200 mb-2">
                        <Image
                          source={{ uri: upiProofImage }}
                          style={{ width: '100%', height: 200, resizeMode: 'contain' }}
                        />
                        <TouchableOpacity
                          onPress={handlePickProofPhoto}
                          className="absolute bottom-2 right-2 px-3 py-1.5 bg-black/70 rounded-full flex-row items-center"
                        >
                          <Ionicons name="camera-reverse" size={14} color="#FFFFFF" style={{ marginRight: 4 }} />
                          <Text className="text-white text-xs font-bold">Retake</Text>
                        </TouchableOpacity>
                      </View>
                    ) : (
                      <TouchableOpacity
                        activeOpacity={0.8}
                        onPress={handlePickProofPhoto}
                        className="w-full border-2 border-dashed border-purple-300 rounded-2xl p-6 items-center justify-center bg-purple-50/30"
                      >
                        <View className="w-12 h-12 rounded-full bg-purple-100 items-center justify-center mb-2">
                          <Ionicons name="camera" size={24} color="#7C3AED" />
                        </View>
                        <Text className="text-xs font-black text-purple-900 mb-0.5">
                          Take Photo of Customer UPI Screen
                        </Text>
                        <Text className="text-[10.5px] text-stone-500 text-center font-medium">
                          Auto-compressed with HD clarity to under 250KB for fast upload
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>

                  {/* Internal Notes */}
                  <View className="mb-4">
                    <Text className="text-xs font-bold text-stone-700 mb-1">
                      Delivery Partner Note (Optional)
                    </Text>
                    <TextInput
                      value={upiNotes}
                      onChangeText={setUpiNotes}
                      placeholder="e.g. Paid via Google Pay to store QR code"
                      placeholderTextColor="#A8929A"
                      className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3.5 py-2 text-xs font-medium text-stone-800"
                    />
                  </View>

                  {/* Submission Notice */}
                  <View className="bg-amber-50 p-3 rounded-xl border border-amber-200 mb-4 flex-row items-start">
                    <Ionicons name="information-circle" size={16} color="#D97706" style={{ marginRight: 6, marginTop: 1 }} />
                    <Text className="text-[11px] text-amber-900 leading-relaxed flex-1 font-medium">
                      Uploading this proof places the payment in <Text className="font-bold">PENDING_VERIFICATION</Text>. Only an authorized administrator who checks the bank credits can mark it <Text className="font-bold">VERIFIED</Text>.
                    </Text>
                  </View>

                  {/* Action Button */}
                  <TouchableOpacity
                    disabled={isUploadingProof}
                    activeOpacity={0.8}
                    onPress={handleSubmitUpiVerification}
                    className="w-full py-3.5 bg-[#D81B60] rounded-2xl items-center justify-center flex-row shadow-sm active:opacity-90 disabled:opacity-50"
                  >
                    {isUploadingProof ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <>
                        <Ionicons name="cloud-upload" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
                        <Text className="text-white font-black text-sm tracking-wide">
                          Submit Payment Proof
                        </Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ── DELIVERY & PAYMENT COLLECTION MODAL (CASH COD & UPI QR CODE) ── */}
      <Modal
        visible={Boolean(deliveryModalOrder)}
        transparent
        animationType="slide"
        onRequestClose={() => setDeliveryModalOrder(null)}
      >
        <View className="flex-1 bg-black/60 justify-end">
          <View className="bg-white rounded-t-3xl p-5 max-h-[90%]">
            <View className="flex-row items-center justify-between pb-3 border-b border-stone-100 mb-3">
              <View className="flex-row items-center gap-2">
                <View className="w-8 h-8 rounded-full bg-emerald-100 items-center justify-center">
                  <Ionicons name="checkmark" size={18} color="#059669" />
                </View>
                <Text className="text-base font-black text-[#3A2430]">
                  Collect Payment & Confirm
                </Text>
              </View>

              <TouchableOpacity onPress={() => setDeliveryModalOrder(null)}>
                <Ionicons name="close-circle" size={24} color="#8C7078" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {deliveryModalOrder && (
                <View className="mb-4">
                  {/* Customer Info Card */}
                  <View className="bg-stone-50 p-3 rounded-2xl border border-stone-200 mb-3">
                    <View className="flex-row items-center justify-between">
                      <Text className="text-xs font-bold text-stone-500">
                        Order #{deliveryModalOrder.id}
                      </Text>
                      <View className={`px-2 py-0.5 rounded-full ${deliveryModalOrder.user_role !== 'general' ? 'bg-purple-100' : 'bg-pink-100'}`}>
                        <Text className={`text-[9.5px] font-black uppercase ${deliveryModalOrder.user_role !== 'general' ? 'text-purple-700' : 'text-[#D81B60]'}`}>
                          {deliveryModalOrder.user_role !== 'general' ? 'B2B Trade' : 'B2C Retail'}
                        </Text>
                      </View>
                    </View>
                    <Text className="text-sm font-black text-[#3A2430] mt-1">
                      {deliveryModalOrder.user_name || 'Customer'}
                    </Text>
                    <Text className="text-xl font-black text-[#D81B60] mt-1.5">
                      Amount to Collect: ₹{modalOrderAmount.toLocaleString('en-IN')}
                    </Text>
                  </View>

                  {/* Payment Mode Selector Tabs (Cash COD vs UPI) */}
                  <Text className="text-xs font-bold text-[#553846] mb-2">
                    Select Customer Payment Method *
                  </Text>
                  <View className="flex-row gap-2 mb-4">
                    {/* Cash Option */}
                    <TouchableOpacity
                      activeOpacity={0.8}
                      onPress={() => setPaymentMode('cash')}
                      className={`flex-1 py-3 px-3 rounded-2xl border flex-row items-center justify-center ${
                        paymentMode === 'cash'
                          ? 'bg-amber-50 border-amber-500 shadow-2xs'
                          : 'bg-white border-stone-200'
                      }`}
                    >
                      <Ionicons
                        name="cash-outline"
                        size={18}
                        color={paymentMode === 'cash' ? '#B45309' : '#8C7078'}
                        style={{ marginRight: 6 }}
                      />
                      <Text className={`text-xs font-black ${paymentMode === 'cash' ? 'text-amber-900' : 'text-[#553846]'}`}>
                        Cash on Delivery
                      </Text>
                    </TouchableOpacity>

                    {/* UPI Option */}
                    <TouchableOpacity
                      activeOpacity={0.8}
                      onPress={() => setPaymentMode('upi')}
                      className={`flex-1 py-3 px-3 rounded-2xl border flex-row items-center justify-center ${
                        paymentMode === 'upi'
                          ? 'bg-purple-50 border-purple-500 shadow-2xs'
                          : 'bg-white border-stone-200'
                      }`}
                    >
                      <Ionicons
                        name="qr-code-outline"
                        size={18}
                        color={paymentMode === 'upi' ? '#7E22CE' : '#8C7078'}
                        style={{ marginRight: 6 }}
                      />
                      <Text className={`text-xs font-black ${paymentMode === 'upi' ? 'text-purple-900' : 'text-[#553846]'}`}>
                        UPI QR Code
                      </Text>
                    </TouchableOpacity>
                  </View>

                  {/* ── UPI PAYMENT SECTION (DYNAMIC QR CODE RENDERER) ── */}
                  {paymentMode === 'upi' && (
                    <View className="mb-4 bg-purple-50/70 border border-purple-200 p-4 rounded-2xl items-center">
                      <View className="flex-row items-center gap-1.5 mb-2">
                        <Ionicons name="sparkles" size={14} color="#7E22CE" />
                        <Text className="text-xs font-black text-purple-900 uppercase tracking-wider">
                          Scan to Pay via Any UPI App
                        </Text>
                      </View>
                      <Text className="text-[11px] text-purple-700 text-center mb-3">
                        Ask customer to scan using Google Pay, PhonePe, Paytm, BHIM, or Banking UPI.
                      </Text>

                      {/* Rendered Live QR Code Image */}
                      <View className="p-3 bg-white rounded-2xl border border-purple-200 shadow-sm mb-3">
                        <Image
                          source={{ uri: displayQrImageUrl }}
                          style={{ width: 190, height: 190 }}
                          resizeMode="contain"
                        />
                      </View>

                      {/* Store UPI Details */}
                      <View className="bg-white px-3.5 py-1.5 rounded-full border border-purple-200 mb-2 flex-row items-center gap-1">
                        <Text className="text-[11px] font-bold text-stone-600">UPI ID: </Text>
                        <Text className="text-[11px] font-black text-purple-900">{storeUpiId}</Text>
                      </View>

                      <Text className="text-[10px] font-bold text-emerald-700 mb-3">
                        ✓ {customMerchantQrUrl ? 'Official Store Merchant QR' : 'Dynamic Order QR Code'}
                      </Text>

                      {/* UPI UTR / Transaction Reference Input */}
                      <View className="w-full mt-1">
                        <Text className="text-xs font-bold text-purple-950 mb-1 ml-1">
                          UPI Reference / UTR Number (12 Digits) *
                        </Text>
                        <TextInput
                          value={upiUtr}
                          onChangeText={setUpiUtr}
                          placeholder="e.g. 412356789012"
                          placeholderTextColor="#A8929A"
                          keyboardType="number-pad"
                          maxLength={16}
                          className="w-full bg-white border border-purple-300 rounded-xl px-3.5 py-2.5 text-xs text-[#3A2430] font-bold"
                        />
                      </View>
                    </View>
                  )}

                  {/* ── CASH COD SECTION ── */}
                  {paymentMode === 'cash' && (
                    <View className="mb-4 bg-amber-50/70 border border-amber-200 p-3.5 rounded-2xl">
                      <Text className="text-xs font-bold text-amber-950 mb-1 ml-1">
                        Exact Cash Amount Collected (₹) *
                      </Text>
                      <TextInput
                        value={cashAmount}
                        onChangeText={setCashAmount}
                        keyboardType="numeric"
                        className="bg-white border border-amber-300 rounded-xl px-3.5 py-2.5 text-sm text-[#3A2430] font-black"
                      />
                    </View>
                  )}

                  {/* Delivery / Proof Notes */}
                  <View className="mb-3">
                    <Text className="text-xs font-bold text-[#553846] mb-1 ml-1">
                      Delivery / Proof Notes (Optional)
                    </Text>
                    <TextInput
                      value={deliveryNote}
                      onChangeText={setDeliveryNote}
                      placeholder="e.g. Delivered to customer at reception, verified"
                      placeholderTextColor="#8C7078"
                      className="bg-stone-50 border border-stone-200 rounded-xl p-3 text-xs text-[#3A2430] font-semibold"
                    />
                  </View>

                  {/* Staff Confirmation Checkbox */}
                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={() => setIsPaymentConfirmedByStaff(!isPaymentConfirmedByStaff)}
                    className="flex-row items-center p-3 rounded-xl bg-emerald-50 border border-emerald-200 mb-4"
                  >
                    <Ionicons
                      name={isPaymentConfirmedByStaff ? 'checkbox' : 'square-outline'}
                      size={20}
                      color="#059669"
                      style={{ marginRight: 8 }}
                    />
                    <Text className="text-xs font-bold text-emerald-800 flex-1">
                      I confirm that ₹{modalOrderAmount.toLocaleString('en-IN')} has been received via {paymentMode.toUpperCase()} in full.
                    </Text>
                  </TouchableOpacity>

                  {/* Confirm & Complete Delivery Button */}
                  <TouchableOpacity
                    activeOpacity={0.9}
                    disabled={isUpdatingStatus}
                    onPress={handleConfirmDelivery}
                    className="w-full py-4 bg-emerald-600 rounded-full flex-row items-center justify-center shadow-md active:opacity-90"
                  >
                    {isUpdatingStatus ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <>
                        <Ionicons name="checkmark-done" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
                        <Text className="text-white font-black text-sm tracking-wide">
                          Confirm Payment & Mark Delivered
                        </Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
};
