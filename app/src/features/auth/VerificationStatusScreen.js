import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Image,
  Linking,
  ActivityIndicator,
  StatusBar,
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFonts } from 'expo-font';
import { GreatVibes_400Regular } from '@expo-google-fonts/great-vibes';
import { useApp } from '../../context/AppContext';
import {
  ROLE_SHORT_TITLES,
  VERIFICATION_STATUSES,
  isUserB2BVerified
} from '../../utils/b2bVerificationService';

export const VerificationStatusScreen = () => {
  const {
    userRole,
    userProfile,
    userVerificationRecord,
    loadUserB2BVerification,
    setCurrentScreen
  } = useApp();

  const [fontsLoaded] = useFonts({
    GreatVibes_400Regular,
  });

  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    if (userProfile?.id) {
      loadUserB2BVerification(userProfile.id);
    }
  }, [userProfile?.id]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await loadUserB2BVerification(userProfile?.id);
    } finally {
      setIsRefreshing(false);
    }
  };

  const status = (userProfile?.verificationStatus || userVerificationRecord?.verification_status || 'submitted').toLowerCase();
  const effectiveRole = userRole || userProfile?.role || 'salon';
  const roleTitle = ROLE_SHORT_TITLES[effectiveRole] || effectiveRole;
  const isApproved = status === 'approved' && isUserB2BVerified(userProfile);
  const isResubmission = status === 'resubmission_required' || status === 'rejected';
  const isSuspended = status === 'suspended';
  const isPending = status === 'submitted' || status === 'under_review';

  const documents = userVerificationRecord?.documents || [];
  const submittedDate = userVerificationRecord?.submitted_at
    ? new Date(userVerificationRecord.submitted_at).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    })
    : 'Recently';

  const rejectionReason = userProfile?.rejectionReason || userVerificationRecord?.rejection_reason || 'Please provide updated proof of business registration or identity.';

  const handleContactSupport = () => {
    Linking.openURL('https://wa.me/919876543210?text=Hello%20Salbeau%20Support,%20I%20have%20an%20inquiry%20regarding%20my%20B2B%20verification');
  };

  return (
    <View className="flex-1 bg-white">
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Header */}
      <View className="px-5 pt-4 pb-3 border-b border-[#FCE4EC] bg-white flex-row items-center justify-between">
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => setCurrentScreen('home')}
          className="w-10 h-10 rounded-full bg-[#FFF0F5] items-center justify-center"
        >
          <Ionicons name="arrow-back" size={20} color="#C2477A" />
        </TouchableOpacity>

        <Text className="text-base font-black text-[#3A2430]">
          Professional Verification
        </Text>

        <TouchableOpacity
          activeOpacity={0.7}
          onPress={handleRefresh}
          className="w-10 h-10 rounded-full bg-stone-100 items-center justify-center"
        >
          {isRefreshing ? (
            <ActivityIndicator size="small" color="#C2477A" />
          ) : (
            <Ionicons name="reload" size={18} color="#553846" />
          )}
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 20, paddingBottom: 60 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Brand Banner */}
        <View className="items-center mb-5">
          <Text
            style={{
              fontFamily: fontsLoaded ? 'GreatVibes_400Regular' : (Platform.OS === 'ios' ? 'Snell Roundhand' : 'serif'),
            }}
            className="text-[34px] text-[#C2477A] text-center"
          >
            Salbeau
          </Text>
          <Text className="text-xs text-[#8C7078] text-center font-bold tracking-wider uppercase">
            {roleTitle} Verification Hub
          </Text>
        </View>

        {/* STATUS CARD 1: UNDER REVIEW / PENDING */}
        {isPending && (
          <View className="bg-blue-50 border border-blue-200 rounded-3xl p-6 mb-6 items-center text-center">
            <View className="w-16 h-16 rounded-full bg-blue-100 items-center justify-center mb-3">
              <Ionicons name="hourglass-outline" size={32} color="#2563EB" />
            </View>

            <View className="bg-blue-600 px-3 py-1 rounded-full mb-3">
              <Text className="text-white text-[11px] font-black uppercase tracking-wider">
                Under Review
              </Text>
            </View>

            <Text className="text-lg font-black text-blue-950 text-center mb-2">
              Your Professional Account is Under Review
            </Text>

            <Text className="text-xs text-blue-800 text-center leading-relaxed font-medium mb-4">
              Your professional account details have been submitted successfully. Our admin team is reviewing your documents and information.
            </Text>

            <View className="w-full bg-white rounded-2xl p-4 border border-blue-100 space-y-2">
              <View className="flex-row justify-between py-1 border-b border-blue-50">
                <Text className="text-xs text-stone-500 font-medium">Selected Role</Text>
                <Text className="text-xs font-bold text-stone-900">{roleTitle}</Text>
              </View>

              <View className="flex-row justify-between py-1 border-b border-blue-50">
                <Text className="text-xs text-stone-500 font-medium">Submitted Date</Text>
                <Text className="text-xs font-bold text-stone-900">{submittedDate}</Text>
              </View>

              <View className="flex-row justify-between py-1">
                <Text className="text-xs text-stone-500 font-medium">Current Catalog Pricing</Text>
                <Text className="text-xs font-bold text-amber-600">Standard Retail (Until Approved)</Text>
              </View>
            </View>
          </View>
        )}

        {/* STATUS CARD 2: RESUBMISSION REQUIRED / REJECTED */}
        {isResubmission && (
          <View className="bg-amber-50 border border-amber-300 rounded-3xl p-6 mb-6">
            <View className="items-center mb-4">
              <View className="w-16 h-16 rounded-full bg-amber-100 items-center justify-center mb-3">
                <Ionicons name="alert-circle" size={32} color="#D97706" />
              </View>

              <View className="bg-amber-500 px-3 py-1 rounded-full mb-2">
                <Text className="text-white text-[11px] font-black uppercase tracking-wider">
                  Verification Update Required
                </Text>
              </View>

              <Text className="text-lg font-black text-amber-950 text-center">
                Action Required On Your Application
              </Text>
            </View>

            {/* Admin's exact feedback */}
            <View className="bg-white rounded-2xl p-4 border border-amber-200 mb-4">
              <Text className="text-[11px] font-black text-amber-900 uppercase tracking-wider mb-1">
                Admin Review Note:
              </Text>
              <Text className="text-xs text-stone-800 leading-relaxed font-semibold">
                "{rejectionReason}"
              </Text>
            </View>

            <TouchableOpacity
              activeOpacity={0.9}
              onPress={() => setCurrentScreen('b2b_verification')}
              className="w-full bg-[#C2477A] py-3.5 rounded-full items-center justify-center shadow-md mb-2"
            >
              <Text className="text-white font-black text-sm">
                Update Details & Resubmit
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* STATUS CARD 3: APPROVED */}
        {isApproved && (
          <View className="bg-emerald-50 border border-emerald-300 rounded-3xl p-6 mb-6 items-center">
            <View className="w-16 h-16 rounded-full bg-emerald-100 items-center justify-center mb-3">
              <Ionicons name="shield-checkmark" size={36} color="#059669" />
            </View>

            <View className="bg-emerald-600 px-3.5 py-1 rounded-full mb-3">
              <Text className="text-white text-[11px] font-black uppercase tracking-wider">
                Verified B2B Professional
              </Text>
            </View>

            <Text className="text-lg font-black text-emerald-950 text-center mb-1">
              Account Approved & Verified!
            </Text>

            <Text className="text-xs text-emerald-800 text-center font-medium leading-relaxed mb-4">
              Exclusive {roleTitle} wholesale pricing and quantity tier discounts are now fully activated on your account.
            </Text>

            <View className="w-full bg-white rounded-2xl p-4 border border-emerald-200 mb-4">
              <View className="flex-row items-center gap-2 mb-2">
                <Ionicons name="pricetags" size={18} color="#059669" />
                <Text className="text-xs font-black text-emerald-900">
                  {roleTitle} Pricing Activated
                </Text>
              </View>
              <Text className="text-[11px] text-stone-600 leading-relaxed">
                You will see specialized professional rates and bulk quantity tier discounts across all catalog products.
              </Text>
            </View>

            <TouchableOpacity
              activeOpacity={0.9}
              onPress={() => setCurrentScreen('home')}
              className="w-full bg-[#C2477A] py-3.5 rounded-full items-center justify-center shadow-md"
            >
              <Text className="text-white font-black text-sm">
                Explore Products with {roleTitle} Pricing
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* STATUS CARD 4: SUSPENDED */}
        {isSuspended && (
          <View className="bg-rose-50 border border-rose-300 rounded-3xl p-6 mb-6 items-center">
            <View className="w-16 h-16 rounded-full bg-rose-100 items-center justify-center mb-3">
              <Ionicons name="ban" size={32} color="#DC2626" />
            </View>

            <View className="bg-rose-600 px-3 py-1 rounded-full mb-2">
              <Text className="text-white text-[11px] font-black uppercase tracking-wider">
                Account Suspended
              </Text>
            </View>

            <Text className="text-base font-black text-rose-950 text-center mb-2">
              B2B Professional Access Suspended
            </Text>

            <Text className="text-xs text-rose-800 text-center font-medium leading-relaxed mb-4">
              Your professional pricing access has been temporarily suspended by the administrator. General user catalog pricing is active. Please contact support.
            </Text>

            <TouchableOpacity
              onPress={handleContactSupport}
              className="w-full bg-rose-700 py-3.5 rounded-full items-center justify-center"
            >
              <Text className="text-white font-black text-xs">
                Contact Salbeau Support
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* SUBMITTED DOCUMENTS OVERVIEW */}
        {documents.length > 0 && (
          <View className="bg-stone-50 border border-stone-200 rounded-2xl p-4 mb-5">
            <Text className="text-xs font-black text-[#3A2430] uppercase tracking-wider mb-2.5">
              Submitted Documents ({documents.length})
            </Text>

            {documents.map((doc, idx) => (
              <View
                key={idx}
                className="bg-white border border-stone-200 rounded-xl p-3 mb-2 flex-row items-center justify-between"
              >
                <View className="flex-row items-center gap-2.5 flex-1 mr-2">
                  <Image
                    source={{ uri: doc.file_url || doc.url }}
                    className="w-10 h-10 rounded-lg bg-stone-100"
                    resizeMode="cover"
                  />
                  <View className="flex-1">
                    <Text className="text-xs font-bold text-stone-800" numberOfLines={1}>
                      {doc.file_name || doc.name}
                    </Text>
                    <Text className="text-[10px] text-stone-500 uppercase mt-0.5">
                      {(doc.document_type || doc.type || 'proof').replace('_', ' ')}
                    </Text>
                  </View>
                </View>

                <Ionicons name="checkmark-circle" size={18} color="#059669" />
              </View>
            ))}
          </View>
        )}

        {/* CONTACT / SUPPORT OPTION */}
        <View className="bg-[#FFF5F8] border border-[#FCE4EC] rounded-2xl p-4 mb-6">
          <Text className="text-xs font-black text-[#3A2430] mb-1">
            Need Help With Verification?
          </Text>
          <Text className="text-[11px] text-[#8C7078] mb-3 leading-relaxed">
            Our support desk is available Monday to Saturday (9:00 AM – 7:00 PM) to assist you with documents and verification queries.
          </Text>

          <TouchableOpacity
            onPress={handleContactSupport}
            className="border border-[#C2477A] py-2.5 px-4 rounded-full flex-row items-center justify-center gap-2"
          >
            <Ionicons name="logo-whatsapp" size={16} color="#C2477A" />
            <Text className="text-xs font-bold text-[#C2477A]">Chat with Salbeau Verification Team</Text>
          </TouchableOpacity>
        </View>

        {/* BROWSE CATALOG BUTTON */}
        {!isApproved && (
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => setCurrentScreen('home')}
            className="w-full border border-stone-300 py-3.5 rounded-full items-center justify-center"
          >
            <Text className="text-xs font-bold text-stone-700">
              Continue Browsing Retail Catalog
            </Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </View>
  );
};
