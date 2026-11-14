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
 * Matches the reference design mockup pixel-for-pixel:
 *   1. Home (with pink active indicator underline pill)
 *   2. Categories (single-line label, 4-square grid icon)
 *   3. Search (Floating center circular pink button with soft ambient pink glow & curved cradle)
 *   4. Wishlist (Heart icon, with optional orders fallback)
 *   5. Account (Clean person outline)
 */
export const FloatingCenterTabBar = ({ fourthTabMode = 'wishlist' }) => {
  const {
    currentScreen,
    setCurrentScreen,
    userOrdersCount = 0,
    favorites = []
  } = useApp() || {};
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

  // Simple, subtle animated values for tabs
  const homeAnim = useRef(new Animated.Value(currentScreen === 'home' ? 1 : 0)).current;
  const catAnim = useRef(new Animated.Value(currentScreen === 'category' ? 1 : 0)).current;
  const fourthAnim = useRef(
    new Animated.Value(
      currentScreen === 'wishlist' || currentScreen === 'orders' || currentScreen === 'order_details' ? 1 : 0
    )
  ).current;
  const accountAnim = useRef(new Animated.Value(currentScreen === 'profile' ? 1 : 0)).current;

  // Search button press scale animation
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

    const isFourthActive =
      currentScreen === 'wishlist' ||
      currentScreen === 'orders' ||
      currentScreen === 'order_details';

    Animated.timing(fourthAnim, {
      toValue: isFourthActive ? 1 : 0,
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

  // Clean, subtle search tap feedback
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
  const isWishlistActive = currentScreen === 'wishlist';
  const isOrdersActive = currentScreen === 'orders' || currentScreen === 'order_details';
  const isFourthActive = isWishlistActive || isOrdersActive;
  const isAccountActive = currentScreen === 'profile';

  // 4th Tab Configuration (defaults to 'wishlist' matching the design image)
  const isWishlistMode = fourthTabMode === 'wishlist';
  const fourthScreenTarget = isWishlistMode ? 'wishlist' : 'orders';
  const fourthLabel = isWishlistMode ? 'Wishlist' : 'Orders';
  const fourthIconName = isWishlistMode
    ? (isWishlistActive ? 'heart' : 'heart-outline')
    : (isOrdersActive ? 'cube' : 'cube-outline');
  const fourthBadgeCount = isWishlistMode ? (favorites?.length || 0) : userOrdersCount;

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
              size={23}
              color={isHomeActive ? '#D81B60' : '#2D3142'}
            />
          </Animated.View>
          <Text
            numberOfLines={1}
            style={[
              styles.tabLabel,
              {
                color: isHomeActive ? '#D81B60' : '#2D3142',
                fontWeight: isHomeActive ? '700' : '500',
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
              color={isCategoryActive ? '#D81B60' : '#2D3142'}
            />
          </Animated.View>
          <Text
            numberOfLines={1}
            style={[
              styles.tabLabel,
              {
                color: isCategoryActive ? '#D81B60' : '#2D3142',
                fontWeight: isCategoryActive ? '700' : '500',
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
          {/* Smooth contoured white cradle dome rising from the navigation bar */}
          <View style={styles.cradleDome} pointerEvents="none" />

          {/* Touchable Floating Pink Action Button */}
          <TouchableOpacity
            style={styles.fabTouchable}
            activeOpacity={0.88}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            onPress={handleSearchPress}
          >
            {/* Soft pink ambient glow underneath the circular button */}
            <View style={styles.fabPinkGlow} pointerEvents="none" />

            <Animated.View
              style={[
                styles.fabCircle,
                {
                  transform: [{ scale: searchScale }],
                },
              ]}
            >
              <Ionicons name="search" size={26} color="#FFFFFF" />
            </Animated.View>
          </TouchableOpacity>
        </View>

        {/* ========================================================= */}
        {/* 4. FOURTH TAB (WISHLIST / ORDERS)                         */}
        {/* ========================================================= */}
        <TouchableOpacity
          style={styles.tabItem}
          activeOpacity={0.75}
          hitSlop={{ top: 10, bottom: 10, left: 6, right: 6 }}
          onPress={() => handleTabPress(fourthScreenTarget, fourthAnim)}
        >
          <Animated.View
            style={[
              styles.iconWrapper,
              {
                transform: [
                  {
                    scale: fourthAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [1.0, 1.06],
                    }),
                  },
                ],
              },
            ]}
          >
            <Ionicons
              name={fourthIconName}
              size={22}
              color={isFourthActive ? '#D81B60' : '#2D3142'}
            />
            {fourthBadgeCount > 0 && (
              <View style={styles.badgeDot}>
                <Text style={styles.badgeText}>
                  {fourthBadgeCount > 9 ? '9+' : fourthBadgeCount}
                </Text>
              </View>
            )}
          </Animated.View>
          <Text
            numberOfLines={1}
            style={[
              styles.tabLabel,
              {
                color: isFourthActive ? '#D81B60' : '#2D3142',
                fontWeight: isFourthActive ? '700' : '500',
              },
            ]}
          >
            {fourthLabel}
          </Text>
          <Animated.View
            style={[
              styles.activeIndicator,
              {
                opacity: fourthAnim,
                transform: [
                  {
                    scaleX: fourthAnim.interpolate({
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
              color={isAccountActive ? '#D81B60' : '#2D3142'}
            />
          </Animated.View>
          <Text
            numberOfLines={1}
            style={[
              styles.tabLabel,
              {
                color: isAccountActive ? '#D81B60' : '#2D3142',
                fontWeight: isAccountActive ? '700' : '500',
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
    borderTopWidth: 1,
    borderTopColor: '#F0F0F2',
    height: Platform.OS === 'ios' ? 66 : 58,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    paddingBottom: Platform.OS === 'ios' ? 8 : 2,
    // Soft subtle ambient shadow across top edge
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 6,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 2,
    minHeight: 48,
  },
  iconWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    height: 25,
  },
  tabLabel: {
    fontSize: 10,
    marginTop: 2,
    letterSpacing: -0.1,
  },
  activeIndicator: {
    width: 22,
    height: 2.8,
    borderRadius: 1.4,
    backgroundColor: '#D81B60',
    marginTop: 2.5,
  },
  centerFabSlot: {
    width: 72,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 30,
    position: 'relative',
  },
  cradleDome: {
    position: 'absolute',
    top: -20,
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: '#EFEFEF',
    zIndex: 1,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 3,
  },
  fabTouchable: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    marginTop: -16,
    zIndex: 2,
  },
  fabPinkGlow: {
    position: 'absolute',
    bottom: -6,
    width: 44,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#D81B60',
    opacity: 0.32,
    zIndex: -1,
  },
  fabCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#D81B60',
    alignItems: 'center',
    justifyContent: 'center',
    // Soft vibrant pink shadow
    shadowColor: '#D81B60',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.40,
    shadowRadius: 10,
    elevation: 8,
  },
  badgeDot: {
    position: 'absolute',
    top: -3,
    right: -8,
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
