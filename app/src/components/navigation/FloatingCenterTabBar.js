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
 *   4. Orders (Receipt / box icon with live active orders badge)
 *   5. Account (Clean person outline)
 */
export const FloatingCenterTabBar = ({ fourthTabMode = 'orders' }) => {
  const {
    currentScreen,
    setCurrentScreen,
    orders = [],
    userProfile,
    userOrdersCount: contextOrderCount,
    favorites = [],
    setSelectedCategory,
    setSelectedSubcategory
  } = useApp() || {};
  const [isKeyboardVisible, setKeyboardVisible] = useState(false);

  // Active ongoing orders count for badge
  const activeOrdersCount = Array.isArray(orders) ? orders.filter(o => {
    const s = (o?.status || '').toLowerCase();
    return s && s !== 'delivered' && s !== 'completed' && s !== 'cancelled';
  }).length : 0;
  const userOrdersCount = contextOrderCount !== undefined ? contextOrderCount : activeOrdersCount;

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
  const searchAnim = useRef(new Animated.Value(currentScreen === 'search' ? 1 : 0)).current;
  const fourthAnim = useRef(
    new Animated.Value(
      currentScreen === 'orders' || currentScreen === 'wishlist' || currentScreen === 'order_details' ? 1 : 0
    )
  ).current;
  const accountAnim = useRef(new Animated.Value(currentScreen === 'profile' ? 1 : 0)).current;

  const isHomeActive = currentScreen === 'home';
  const isCategoryActive = currentScreen === 'category';
  const isSearchActive = currentScreen === 'search';
  const isOrdersActive = currentScreen === 'orders' || currentScreen === 'order_details';
  const isWishlistActive = currentScreen === 'wishlist';
  const isOrdersMode = fourthTabMode === 'orders';
  const isFourthActive = isOrdersMode ? isOrdersActive : isWishlistActive;
  const isAccountActive = currentScreen === 'profile';

  // Smooth active indicator transitions
  useEffect(() => {
    Animated.timing(homeAnim, {
      toValue: isHomeActive ? 1 : 0,
      duration: 180,
      useNativeDriver: true,
    }).start();

    Animated.timing(catAnim, {
      toValue: isCategoryActive ? 1 : 0,
      duration: 180,
      useNativeDriver: true,
    }).start();

    Animated.timing(searchAnim, {
      toValue: isSearchActive ? 1 : 0,
      duration: 180,
      useNativeDriver: true,
    }).start();

    Animated.timing(fourthAnim, {
      toValue: isFourthActive ? 1 : 0,
      duration: 180,
      useNativeDriver: true,
    }).start();

    Animated.timing(accountAnim, {
      toValue: isAccountActive ? 1 : 0,
      duration: 180,
      useNativeDriver: true,
    }).start();
  }, [currentScreen, isHomeActive, isCategoryActive, isSearchActive, isFourthActive, isAccountActive]);

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

    if (screenId === 'category') {
      if (typeof setSelectedCategory === 'function') setSelectedCategory(null);
      if (typeof setSelectedSubcategory === 'function') setSelectedSubcategory(null);
    }

    setCurrentScreen(screenId);
  };

  if (isKeyboardVisible) {
    return null;
  }

  // 4th Tab Configuration (defaults to 'orders')
  const fourthScreenTarget = isOrdersMode ? 'orders' : 'wishlist';
  const fourthLabel = isOrdersMode ? 'Orders' : 'Wishlist';
  const fourthIconName = isOrdersMode
    ? (isOrdersActive ? 'receipt' : 'receipt-outline')
    : (isWishlistActive ? 'heart' : 'heart-outline');
  const fourthBadgeCount = isOrdersMode ? userOrdersCount : (favorites?.length || 0);

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
        {/* 3. CENTER SEARCH TAB                                      */}
        {/* ========================================================= */}
        <TouchableOpacity
          style={styles.tabItem}
          activeOpacity={0.75}
          hitSlop={{ top: 10, bottom: 10, left: 6, right: 6 }}
          onPress={() => handleTabPress('search', searchAnim)}
        >
          <Animated.View
            style={[
              styles.iconWrapper,
              {
                transform: [
                  {
                    scale: searchAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [1.0, 1.06],
                    }),
                  },
                ],
              },
            ]}
          >
            <Ionicons
              name={isSearchActive ? 'search' : 'search-outline'}
              size={22}
              color={isSearchActive ? '#D81B60' : '#2D3142'}
            />
          </Animated.View>
          <Text
            numberOfLines={1}
            style={[
              styles.tabLabel,
              {
                color: isSearchActive ? '#D81B60' : '#2D3142',
                fontWeight: isSearchActive ? '700' : '500',
              },
            ]}
          >
            Search
          </Text>
          <Animated.View
            style={[
              styles.activeIndicator,
              {
                opacity: searchAnim,
                transform: [
                  {
                    scaleX: searchAnim.interpolate({
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
