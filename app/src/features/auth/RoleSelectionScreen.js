import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Platform,
  ActivityIndicator,
  TouchableWithoutFeedback
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useFonts } from 'expo-font';
import { GreatVibes_400Regular } from '@expo-google-fonts/great-vibes';
import { useApp } from '../../context/AppContext';

// ── CUSTOM LUXURY VECTOR ICONS ──────────────────────────────────────────

// Precise Salon Styling Chair Icon matching reference image
const SalonChairIcon = ({ color = '#B9477D', size = 20 }) => (
  <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
    {/* Headrest */}
    <View
      style={{
        width: 8,
        height: 3,
        borderRadius: 1.5,
        borderWidth: 1.2,
        borderColor: color,
        marginBottom: 1,
      }}
    />
    {/* Backrest & Seat */}
    <View
      style={{
        width: 14,
        height: 8,
        borderTopLeftRadius: 3,
        borderTopRightRadius: 3,
        borderWidth: 1.4,
        borderColor: color,
        borderBottomWidth: 1.8,
      }}
    />
    {/* Stem Pole */}
    <View style={{ width: 1.6, height: 4, backgroundColor: color }} />
    {/* Base Disc */}
    <View style={{ width: 12, height: 1.4, backgroundColor: color, borderRadius: 1 }} />
  </View>
);

// Precise Beautician Lotus Flower Icon matching reference image
const BeauticianLotusIcon = ({ color = '#B9477D', size = 20 }) => (
  <MaterialCommunityIcons name="spa-outline" size={size} color={color} />
);

// Precise Makeup Artist Brush Icon matching reference image
const MakeupArtistBrushIcon = ({ color = '#B9477D', size = 20 }) => (
  <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
    <MaterialCommunityIcons
      name="brush-variant"
      size={size - 2}
      color={color}
      style={{ transform: [{ rotate: '-45deg' }] }}
    />
    <Text
      style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        fontSize: 7,
        color: '#D5B078',
        fontWeight: 'bold',
        lineHeight: 8,
      }}
    >
      ✦
    </Text>
  </View>
);

// ── MAIN COMPONENT ──────────────────────────────────────────────────────

export const RoleSelectionScreen = () => {
  const { userRole, setUserRole, setCurrentScreen, userProfile } = useApp();

  const [fontsLoaded] = useFonts({
    GreatVibes_400Regular,
  });

  // Account Type: 'general_user' | 'business'
  // Default to 'business' matching the reference screenshot
  const initialAccountType = userRole === 'general' ? 'general_user' : 'business';
  const [accountType, setAccountType] = useState(initialAccountType);

  // Business Role: 'salon' | 'beautician' | 'artist' | null
  const initialRole = (userRole && userRole !== 'general') ? userRole : null;
  const [selectedRole, setSelectedRole] = useState(initialRole);

  // Dropdown open state (default open when business is selected and no role picked yet, matching screenshot)
  const [isDropdownOpen, setIsDropdownOpen] = useState(initialAccountType === 'business' && !initialRole);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Role details mapping
  const ROLE_OPTIONS = [
    {
      id: 'salon',
      title: 'Salon',
      icon: (color) => <SalonChairIcon color={color} size={22} />,
    },
    {
      id: 'beautician',
      title: 'Beautician',
      icon: (color) => <BeauticianLotusIcon color={color} size={22} />,
    },
    {
      id: 'artist',
      title: 'Artist',
      icon: (color) => <MakeupArtistBrushIcon color={color} size={22} />,
    },
  ];

  const handleSelectAccountType = (type) => {
    setAccountType(type);
    if (type === 'business') {
      setIsDropdownOpen(true);
    } else {
      setIsDropdownOpen(false);
    }
  };

  const handleSelectRole = (roleId) => {
    setSelectedRole(roleId);
    setIsDropdownOpen(false);
  };

  // Validation: General User is enabled immediately. Business User requires role selection.
  const isContinueEnabled =
    accountType === 'general_user' ||
    (accountType === 'business' && Boolean(selectedRole));

  const handleContinue = () => {
    if (!isContinueEnabled || isSubmitting) return;
    setIsSubmitting(true);

    try {
      if (accountType === 'general_user') {
        setUserRole('general');
        setCurrentScreen('complete_profile');
      } else {
        setUserRole(selectedRole || 'salon');
        setCurrentScreen('b2b_registration');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedRoleObj = ROLE_OPTIONS.find((r) => r.id === selectedRole);

  return (
    <TouchableWithoutFeedback onPress={() => setIsDropdownOpen(false)}>
      <View style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
        <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

        {/* ── LUXURY DECORATIVE GOLD CURVES (BACKGROUND) ─────────────── */}
        <View
          pointerEvents="none"
          style={{
            position: 'absolute',
            top: -40,
            right: -30,
            width: 210,
            height: 250,
            borderBottomLeftRadius: 180,
            borderLeftWidth: 1.2,
            borderBottomWidth: 1.2,
            borderColor: 'rgba(213, 176, 120, 0.4)',
            transform: [{ rotate: '12deg' }],
          }}
        />
        <View
          pointerEvents="none"
          style={{
            position: 'absolute',
            top: -20,
            right: -60,
            width: 220,
            height: 270,
            borderBottomLeftRadius: 200,
            borderLeftWidth: 0.8,
            borderBottomWidth: 0.8,
            borderColor: 'rgba(213, 176, 120, 0.25)',
            transform: [{ rotate: '22deg' }],
          }}
        />
        <View
          pointerEvents="none"
          style={{
            position: 'absolute',
            bottom: -50,
            left: -40,
            width: 200,
            height: 240,
            borderTopRightRadius: 180,
            borderRightWidth: 1.2,
            borderTopWidth: 1.2,
            borderColor: 'rgba(213, 176, 120, 0.35)',
            transform: [{ rotate: '8deg' }],
          }}
        />

        {/* ── MAIN SCROLLABLE CONTENT ─────────────────────────────────── */}
        <ScrollView
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            flexGrow: 1,
            paddingHorizontal: 24,
            paddingTop: Platform.OS === 'android' ? 24 : 12,
            paddingBottom: 36,
            justifyContent: 'space-between',
          }}
        >
          <View>
            {/* ── TOP NAVIGATION ROW (BACK TO LOGIN & VERIFIED PHONE) ─── */}
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 10,
              }}
            >
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => setCurrentScreen('login')}
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 19,
                  backgroundColor: '#FFF0F5',
                  borderWidth: 1,
                  borderColor: '#FCE4EC',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Ionicons name="arrow-back" size={20} color="#B9477D" />
              </TouchableOpacity>

              {userProfile?.phone ? (
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    backgroundColor: '#F0FDF4',
                    borderWidth: 1,
                    borderColor: '#DCFCE7',
                    paddingHorizontal: 10,
                    paddingVertical: 5,
                    borderRadius: 14,
                  }}
                >
                  <Ionicons name="checkmark-circle" size={14} color="#16A34A" style={{ marginRight: 5 }} />
                  <Text style={{ fontSize: 11, fontWeight: '700', color: '#166534' }}>
                    {userProfile.phone} Verified
                  </Text>
                </View>
              ) : (
                <View style={{ width: 38 }} />
              )}
            </View>

            {/* ── BRAND LOGO & GOLD DIVIDER ─────────────────────────────── */}
            <View style={{ alignItems: 'center', marginTop: 4, marginBottom: 16 }}>
              <Text
                style={{
                  fontFamily: fontsLoaded ? 'GreatVibes_400Regular' : Platform.OS === 'ios' ? 'Snell Roundhand' : 'serif',
                  fontSize: 44,
                  color: '#B9477D',
                  textAlign: 'center',
                  lineHeight: 52,
                }}
              >
                Salbeau
              </Text>

              {/* Decorative Gold Divider with Centered 4-Point Star */}
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 130,
                  marginTop: 2,
                }}
              >
                <View style={{ flex: 1, height: 1, backgroundColor: '#D5B078', opacity: 0.6 }} />
                <Text
                  style={{
                    marginHorizontal: 8,
                    color: '#D5B078',
                    fontSize: 12,
                    lineHeight: 14,
                  }}
                >
                  ✦
                </Text>
                <View style={{ flex: 1, height: 1, backgroundColor: '#D5B078', opacity: 0.6 }} />
              </View>
            </View>

            {/* ── HEADING SECTION ────────────────────────────────────────── */}
            <View style={{ alignItems: 'center', marginBottom: 26 }}>
              <Text
                style={{
                  fontFamily: Platform.select({ ios: 'Georgia', android: 'serif' }),
                  fontSize: 28,
                  fontWeight: '700',
                  color: '#30212B',
                  textAlign: 'center',
                  marginBottom: 8,
                  letterSpacing: -0.2,
                }}
              >
                Who's shopping today?
              </Text>
              <Text
                style={{
                  fontSize: 13.5,
                  fontWeight: '500',
                  color: '#8B777F',
                  textAlign: 'center',
                  lineHeight: 19,
                  maxWidth: '90%',
                }}
              >
                Choose your account type to see the right pricing for you.
              </Text>
            </View>

            {/* ── ACCOUNT TYPE SECTION ──────────────────────────────────── */}
            <View style={{ marginBottom: 20 }}>
              <Text
                style={{
                  fontSize: 11,
                  fontWeight: '700',
                  color: '#8B777F',
                  letterSpacing: 1.2,
                  textTransform: 'uppercase',
                  marginBottom: 12,
                  marginLeft: 2,
                }}
              >
                ACCOUNT TYPE
              </Text>

              {/* CARD 1: GENERAL USER */}
              <TouchableOpacity
                activeOpacity={0.88}
                onPress={() => handleSelectAccountType('general_user')}
                style={{
                  backgroundColor: accountType === 'general_user' ? '#FFF5F8' : '#FFFFFF',
                  borderRadius: 20,
                  borderWidth: 1.5,
                  borderColor: accountType === 'general_user' ? '#B9477D' : '#EADDE4',
                  paddingHorizontal: 16,
                  paddingVertical: 14,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: 12,
                  shadowColor: '#30212B',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: accountType === 'general_user' ? 0.05 : 0.02,
                  shadowRadius: 6,
                  elevation: 1,
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, paddingRight: 10 }}>
                  {/* Shopping Bag Icon Container */}
                  <View
                    style={{
                      width: 50,
                      height: 50,
                      borderRadius: 14,
                      backgroundColor: '#FCF4F8',
                      borderWidth: 1,
                      borderColor: '#F5E3EC',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginRight: 14,
                    }}
                  >
                    <Ionicons name="bag-outline" size={24} color="#B9477D" />
                  </View>

                  {/* Texts */}
                  <View style={{ flex: 1 }}>
                    <Text
                      style={{
                        fontFamily: Platform.select({ ios: 'Georgia', android: 'serif' }),
                        fontSize: 16.5,
                        fontWeight: '700',
                        color: '#30212B',
                        marginBottom: 2,
                      }}
                    >
                      General User
                    </Text>
                    <Text style={{ fontSize: 13, color: '#8B777F', fontWeight: '500' }}>
                      Shop for yourself
                    </Text>
                  </View>
                </View>

                {/* Radio Button */}
                <View
                  style={{
                    width: 24,
                    height: 24,
                    borderRadius: 12,
                    backgroundColor: accountType === 'general_user' ? '#B9477D' : 'transparent',
                    borderWidth: accountType === 'general_user' ? 0 : 1.5,
                    borderColor: '#D9C7D1',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {accountType === 'general_user' && (
                    <Ionicons name="checkmark" size={15} color="#FFFFFF" />
                  )}
                </View>
              </TouchableOpacity>

              {/* CARD 2: BUSINESS USER */}
              <TouchableOpacity
                activeOpacity={0.92}
                onPress={() => handleSelectAccountType('business')}
                style={{
                  backgroundColor: accountType === 'business' ? '#FFF5F8' : '#FFFFFF',
                  borderRadius: 20,
                  borderWidth: 1.5,
                  borderColor: accountType === 'business' ? '#E89CBF' : '#EADDE4',
                  paddingHorizontal: 16,
                  paddingTop: 14,
                  paddingBottom: accountType === 'business' ? 16 : 14,
                  shadowColor: '#30212B',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: accountType === 'business' ? 0.05 : 0.02,
                  shadowRadius: 6,
                  elevation: 1,
                }}
              >
                {/* Header Row */}
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, paddingRight: 10 }}>
                    {/* Storefront Icon Container */}
                    <View
                      style={{
                        width: 50,
                        height: 50,
                        borderRadius: 14,
                        backgroundColor: '#FCF4F8',
                        borderWidth: 1,
                        borderColor: '#F5E3EC',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginRight: 14,
                      }}
                    >
                      <Ionicons name="storefront-outline" size={24} color="#B9477D" />
                    </View>

                    {/* Texts */}
                    <View style={{ flex: 1 }}>
                      <Text
                        style={{
                          fontFamily: Platform.select({ ios: 'Georgia', android: 'serif' }),
                          fontSize: 16.5,
                          fontWeight: '700',
                          color: '#30212B',
                          marginBottom: 2,
                        }}
                      >
                        Business User
                      </Text>
                      <Text style={{ fontSize: 13, color: '#8B777F', fontWeight: '500' }}>
                        For professional business accounts
                      </Text>
                    </View>
                  </View>

                  {/* Radio Button */}
                  <View
                    style={{
                      width: 24,
                      height: 24,
                      borderRadius: 12,
                      backgroundColor: accountType === 'business' ? '#B9477D' : 'transparent',
                      borderWidth: accountType === 'business' ? 0 : 1.5,
                      borderColor: '#D9C7D1',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {accountType === 'business' && (
                      <Ionicons name="checkmark" size={15} color="#FFFFFF" />
                    )}
                  </View>
                </View>

                {/* ── BUSINESS ROLE SELECTION (REVEALED WHEN BUSINESS USER IS SELECTED) ── */}
                {accountType === 'business' && (
                  <View style={{ marginTop: 16 }}>
                    <Text
                      style={{
                        fontSize: 10.5,
                        fontWeight: '700',
                        color: '#8B777F',
                        letterSpacing: 1.1,
                        textTransform: 'uppercase',
                        marginBottom: 8,
                        marginLeft: 1,
                      }}
                    >
                      SELECT YOUR ROLE
                    </Text>

                    {/* Dropdown Field Pill */}
                    <TouchableOpacity
                      activeOpacity={0.85}
                      onPress={() => setIsDropdownOpen(!isDropdownOpen)}
                      style={{
                        backgroundColor: '#FFFFFF',
                        borderWidth: 1,
                        borderColor: isDropdownOpen ? '#B9477D' : '#EADDE4',
                        borderRadius: 16,
                        paddingHorizontal: 16,
                        paddingVertical: 13,
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        shadowColor: '#30212B',
                        shadowOffset: { width: 0, height: 1 },
                        shadowOpacity: 0.04,
                        shadowRadius: 4,
                        elevation: 1,
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 14,
                          fontWeight: selectedRoleObj ? '600' : '400',
                          color: selectedRoleObj ? '#30212B' : '#8B777F',
                          fontFamily: selectedRoleObj
                            ? Platform.select({ ios: 'Georgia', android: 'serif' })
                            : undefined,
                        }}
                      >
                        {selectedRoleObj ? selectedRoleObj.title : 'Choose a role'}
                      </Text>
                      <Ionicons
                        name={isDropdownOpen ? 'chevron-up' : 'chevron-down'}
                        size={18}
                        color="#B9477D"
                      />
                    </TouchableOpacity>

                    {/* Dropdown Options Menu */}
                    {isDropdownOpen && (
                      <View
                        style={{
                          backgroundColor: '#FFFFFF',
                          borderRadius: 16,
                          borderWidth: 1,
                          borderColor: '#EADDE4',
                          marginTop: 6,
                          overflow: 'hidden',
                          shadowColor: '#30212B',
                          shadowOffset: { width: 0, height: 4 },
                          shadowOpacity: 0.08,
                          shadowRadius: 10,
                          elevation: 4,
                        }}
                      >
                        {ROLE_OPTIONS.map((item, index) => {
                          const isSelected = selectedRole === item.id;
                          return (
                            <React.Fragment key={item.id}>
                              <TouchableOpacity
                                activeOpacity={0.8}
                                onPress={() => handleSelectRole(item.id)}
                                style={{
                                  flexDirection: 'row',
                                  alignItems: 'center',
                                  paddingHorizontal: 16,
                                  paddingVertical: 13,
                                  backgroundColor: isSelected ? '#FFF0F5' : '#FFFFFF',
                                }}
                              >
                                <View style={{ width: 30, alignItems: 'center', marginRight: 12 }}>
                                  {item.icon(isSelected ? '#B9477D' : '#8B777F')}
                                </View>
                                <Text
                                  style={{
                                    fontFamily: Platform.select({ ios: 'Georgia', android: 'serif' }),
                                    fontSize: 15,
                                    fontWeight: '700',
                                    color: isSelected ? '#B9477D' : '#30212B',
                                    flex: 1,
                                  }}
                                >
                                  {item.title}
                                </Text>
                                {isSelected && (
                                  <Ionicons name="checkmark" size={16} color="#B9477D" />
                                )}
                              </TouchableOpacity>
                              {index < ROLE_OPTIONS.length - 1 && (
                                <View
                                  style={{
                                    height: 1,
                                    backgroundColor: '#F3E8EE',
                                    marginHorizontal: 16,
                                  }}
                                />
                              )}
                            </React.Fragment>
                          );
                        })}
                      </View>
                    )}
                  </View>
                )}
              </TouchableOpacity>
            </View>
          </View>

          {/* ── BOTTOM ACTION: CONTINUE BUTTON ──────────────────────────── */}
          <View style={{ marginTop: 20 }}>
            <TouchableOpacity
              activeOpacity={0.9}
              disabled={!isContinueEnabled || isSubmitting}
              onPress={handleContinue}
              style={{
                backgroundColor: isContinueEnabled ? '#B9477D' : '#E8DCE3',
                height: 58,
                borderRadius: 29,
                alignItems: 'center',
                justifyContent: 'center',
                flexDirection: 'row',
                shadowColor: isContinueEnabled ? '#B9477D' : 'transparent',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: isContinueEnabled ? 0.28 : 0,
                shadowRadius: 10,
                elevation: isContinueEnabled ? 4 : 0,
              }}
            >
              {isSubmitting ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <>
                  <Text
                    style={{
                      color: isContinueEnabled ? '#FFFFFF' : '#A8929A',
                      fontSize: 16.5,
                      fontWeight: '700',
                      letterSpacing: 0.3,
                      marginRight: 6,
                    }}
                  >
                    Continue
                  </Text>
                  <Ionicons
                    name="arrow-forward"
                    size={18}
                    color={isContinueEnabled ? '#FFFFFF' : '#A8929A'}
                  />
                </>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    </TouchableWithoutFeedback>
  );
};
