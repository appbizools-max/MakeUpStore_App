import React, { useRef, useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Platform,
  Keyboard
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../../context/AppContext';

/**
 * Premium Floating Center Tab Bar
 * 5 Navigation Items:
 *   1. Home
 *   2. Categories
 *   3. Search (Clean Floating Action Button with subtle animation, no outer halo)
 *   4. Orders (with live order count badge)
 *   5. Account
 */
export const FloatingCenterTabBar = () => {
  const { currentScreen, setCurrentScreen, userOrdersCount = 0 } = useApp() || {};
  const [isKeyboardVisible, setKeyboardVisible] = useState(false);

  // Auto-hide when keyboard is open so it never overlaps inputs
  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const showSub = Keyboard.addListener(showEvent, () => setKeyboardVisible(true));
    const hideSub = Keyboard.addListener(hideEvent, () => setKeyboardVisible(false));

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  // Simple, subtle animated values
  const homeAnim = useRef(new Animated.Value(currentScreen === 'home' ? 1 : 0)).current;
  const catAnim = useRef(new Animated.Value(currentScreen === 'category' ? 1 : 0)).current;
  const ordersAnim = useRef(new Animated.Value((currentScreen === 'orders' || currentScreen === 'order_details') ? 1 : 0)).current;
  const accountAnim = useRef(new Animated.Value(currentScreen === 'profile' ? 1 : 0)).current;

  // Search button simple press animation
  const searchScale = useRef(new Animated.Value(1.0)).current;

  // Smooth active indicator transitions
  useEffect(() => {
    Animated.timing(homeAnim, {
      toValue: currentScreen === 'home' ? 1 : 0,
      duration: 180,
      useNativeDriver: true,
    }).start();

    Animated.timing(catAnim, {
      toValue: currentScreen === 'category' ? 1 : 0,
      duration: 180,
      useNativeDriver: true,
    }).start();

    const isOrders = currentScreen === 'orders' || currentScreen === 'order_details';
    Animated.timing(ordersAnim, {
      toValue: isOrders ? 1 : 0,
      duration: 180,
      useNativeDriver: true,
    }).start();

    Animated.timing(accountAnim, {
      toValue: currentScreen === 'profile' ? 1 : 0,
      duration: 180,
      useNativeDriver: true,
    }).start();
  }, [currentScreen]);

  // Subtle tap feedback for normal tabs
  const handleTabPress = (screenId, animVal) => {
    Animated.sequence([
      Animated.timing(animVal, {
        toValue: 0.92,
        duration: 70,
        useNativeDriver: true,
      }),
      Animated.spring(animVal, {
        toValue: 1.0,
        friction: 6,
        tension: 80,
        useNativeDriver: true,
      }),
    ]).start();

    setCurrentScreen(screenId);
  };

  // Clean, subtle search tap feedback (simple scale down & spring back)
  const handleSearchPress = () => {
    Animated.sequence([
      Animated.timing(searchScale, {
        toValue: 0.92,
        duration: 70,
        useNativeDriver: true,
      }),
      Animated.spring(searchScale, {
        toValue: 1.0,
        friction: 5,
        tension: 80,
        useNativeDriver: true,
      }),
    ]).start();

    setCurrentScreen('search');
  };

  if (isKeyboardVisible) {
    return null;
  }

  const isHomeActive = currentScreen === 'home';
  const isCategoryActive = currentScreen === 'category';
  const isSearchActive = currentScreen === 'search';
  const isOrdersActive = currentScreen === 'orders' || currentScreen === 'order_details';
  const isAccountActive = currentScreen === 'profile';

  return (
    <View style={styles.outerContainer} pointerEvents="box-none">
      <View style={styles.navBar}>
        {/* ========================================================= */}
        {/* 1. HOME TAB                                               */}
        {/* ========================================================= */}
        <TouchableOpacity
          style={styles.tabItem}
          activeOpacity={0.75}
          hitSlop={{ top: 10, bottom: 10, left: 6, right: 6 }}
          onPress={() => handleTabPress('home', homeAnim)}
        >
          <Animated.View
            style={[
              styles.iconWrapper,
              {
                transform: [
                  {
                    scale: homeAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [1.0, 1.06],
                    }),
                  },
                ],
              },
            ]}
          >
            <Ionicons
              name={isHomeActive ? 'home' : 'home-outline'}
              size={22}
              color={isHomeActive ? '#D81B60' : '#2D3748'}
            />
          </Animated.View>
          <Text
            numberOfLines={1}
            style={[
              styles.tabLabel,
              {
                color: isHomeActive ? '#D81B60' : '#2D3748',
                fontWeight: isHomeActive ? '800' : '600',
              },
            ]}
          >
            Home
          </Text>
          <Animated.View
            style={[
              styles.activeIndicator,
              {
                opacity: homeAnim,
                transform: [
                  {
                    scaleX: homeAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, 1],
                    }),
                  },
                ],
              },
            ]}
          />
        </TouchableOpacity>

        {/* ========================================================= */}
        {/* 2. CATEGORIES TAB                                         */}
        {/* ========================================================= */}
        <TouchableOpacity
          style={styles.tabItem}
          activeOpacity={0.75}
          hitSlop={{ top: 10, bottom: 10, left: 6, right: 6 }}
          onPress={() => handleTabPress('category', catAnim)}
        >
          <Animated.View
            style={[
              styles.iconWrapper,
              {
                transform: [
                  {
                    scale: catAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [1.0, 1.06],
                    }),
                  },
                ],
              },
            ]}
          >
            <Ionicons
              name={isCategoryActive ? 'grid' : 'grid-outline'}
              size={22}
              color={isCategoryActive ? '#D81B60' : '#2D3748'}
            />
          </Animated.View>
          <Text
            numberOfLines={1}
            style={[
              styles.tabLabel,
              {
                color: isCategoryActive ? '#D81B60' : '#2D3748',
                fontWeight: isCategoryActive ? '800' : '600',
              },
            ]}
          >
            Categories
          </Text>
          <Animated.View
            style={[
              styles.activeIndicator,
              {
                opacity: catAnim,
                transform: [
                  {
                    scaleX: catAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, 1],
                    }),
                  },
                ],
              },
            ]}
          />
        </TouchableOpacity>

        {/* ========================================================= */}
        {/* 3. CENTER SEARCH TAB (FLOATING ACTION BUTTON)             */}
        {/* ========================================================= */}
        <View style={styles.centerFabSlot} pointerEvents="box-none">
          {/* Subtle curved notch backdrop blending into top navbar border */}
          <View style={styles.centerArchBackdrop} pointerEvents="none" />

          <TouchableOpacity
            style={styles.fabTouchable}
            activeOpacity={0.88}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            onPress={handleSearchPress}
          >
            <Animated.View
              style={[
                styles.fabCircle,
                {
                  transform: [{ scale: searchScale }],
                },
              ]}
            >
              <Ionicons name="search" size={24} color="#FFFFFF" />
            </Animated.View>
          </TouchableOpacity>
        </View>

        {/* ========================================================= */}
        {/* 4. ORDERS TAB                                             */}
        {/* ========================================================= */}
        <TouchableOpacity
          style={styles.tabItem}
          activeOpacity={0.75}
          hitSlop={{ top: 10, bottom: 10, left: 6, right: 6 }}
          onPress={() => handleTabPress('orders', ordersAnim)}
        >
          <Animated.View
            style={[
              styles.iconWrapper,
              {
                transform: [
                  {
                    scale: ordersAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [1.0, 1.06],
                    }),
                  },
                ],
              },
            ]}
          >
            <Ionicons
              name={isOrdersActive ? 'cube' : 'cube-outline'}
              size={22}
              color={isOrdersActive ? '#D81B60' : '#2D3748'}
            />
            {userOrdersCount > 0 && (
              <View style={styles.badgeDot}>
                <Text style={styles.badgeText}>
                  {userOrdersCount > 9 ? '9+' : userOrdersCount}
                </Text>
              </View>
            )}
          </Animated.View>
          <Text
            numberOfLines={1}
            style={[
              styles.tabLabel,
              {
                color: isOrdersActive ? '#D81B60' : '#2D3748',
                fontWeight: isOrdersActive ? '800' : '600',
              },
            ]}
          >
            Orders
          </Text>
          <Animated.View
            style={[
              styles.activeIndicator,
              {
                opacity: ordersAnim,
                transform: [
                  {
                    scaleX: ordersAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, 1],
                    }),
                  },
                ],
              },
            ]}
          />
        </TouchableOpacity>

        {/* ========================================================= */}
        {/* 5. ACCOUNT TAB                                            */}
        {/* ========================================================= */}
        <TouchableOpacity
          style={styles.tabItem}
          activeOpacity={0.75}
          hitSlop={{ top: 10, bottom: 10, left: 6, right: 6 }}
          onPress={() => handleTabPress('profile', accountAnim)}
        >
          <Animated.View
            style={[
              styles.iconWrapper,
              {
                transform: [
                  {
                    scale: accountAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [1.0, 1.06],
                    }),
                  },
                ],
              },
            ]}
          >
            <Ionicons
              name={isAccountActive ? 'person' : 'person-outline'}
              size={22}
              color={isAccountActive ? '#D81B60' : '#2D3748'}
            />
          </Animated.View>
          <Text
            numberOfLines={1}
            style={[
              styles.tabLabel,
              {
                color: isAccountActive ? '#D81B60' : '#2D3748',
                fontWeight: isAccountActive ? '800' : '600',
              },
            ]}
          >
            Account
          </Text>
          <Animated.View
            style={[
              styles.activeIndicator,
              {
                opacity: accountAnim,
                transform: [
                  {
                    scaleX: accountAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, 1],
                    }),
                  },
                ],
              },
            ]}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  outerContainer: {
    backgroundColor: 'transparent',
    position: 'relative',
    width: '100%',
  },
  navBar: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F2',
    height: Platform.OS === 'ios' ? 66 : 58,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    paddingBottom: Platform.OS === 'ios' ? 8 : 2,
    // Clean soft shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 8,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 2,
    minHeight: 46,
  },
  iconWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  tabLabel: {
    fontSize: 9.5,
    marginTop: 2,
    letterSpacing: -0.1,
  },
  activeIndicator: {
    width: 20,
    height: 2.8,
    borderRadius: 1.5,
    backgroundColor: '#D81B60',
    marginTop: 2,
  },
  centerFabSlot: {
    width: 66,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 30,
    position: 'relative',
  },
  centerArchBackdrop: {
    position: 'absolute',
    top: -14,
    width: 66,
    height: 36,
    borderTopLeftRadius: 33,
    borderTopRightRadius: 33,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: '#F0F0F2',
    zIndex: 1,
  },
  fabTouchable: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    marginTop: -18,
    zIndex: 2,
  },
  fabCircle: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: '#D81B60',
    borderWidth: 3,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    // Clean, natural elevation without oversized pink blur
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.18,
    shadowRadius: 5,
    elevation: 6,
  },
  badgeDot: {
    position: 'absolute',
    top: -2,
    right: -7,
    backgroundColor: '#D81B60',
    minWidth: 14,
    height: 14,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
    paddingHorizontal: 2,
  },
  badgeText: {
    fontSize: 7.5,
    fontWeight: '800',
    color: '#FFFFFF',
    lineHeight: 9,
  },
});
