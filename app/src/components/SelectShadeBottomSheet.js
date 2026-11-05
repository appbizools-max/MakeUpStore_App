import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  Image,
  ScrollView,
  Dimensions,
  Animated,
  TouchableWithoutFeedback,
  Platform,
  StyleSheet
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import { getSafeImageSource } from '../utils/imageUtils';
import { getCartKey, getSafeProductShadesList } from '../utils/cartKeyUtils';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Standard Curated Beauty Shades Palette matching prompt specifications
const DEFAULT_BEAUTY_SHADES = [
  { id: 'shade_peach_pop', name: 'Peach Pop', hexColor: '#F4A18D', undertone: 'Warm Peach', isBestseller: true },
  { id: 'shade_rose_petal', name: 'Rose Petal', hexColor: '#E9869B', undertone: 'Soft Rose', isBestseller: true },
  { id: 'shade_coral_crush', name: 'Coral Crush', hexColor: '#F0645C', undertone: 'Vibrant Coral', isBestseller: true },
  { id: 'shade_berry_blush', name: 'Berry Blush', hexColor: '#B64B75', undertone: 'Deep Berry', isBestseller: true },
  { id: 'shade_nude_pink', name: 'Nude Pink', hexColor: '#E5A6A0', undertone: 'Neutral Nude', isBestseller: false },
];

/**
 * Salbeau Product Shade Selection Bottom Sheet
 * 
 * Multi-Shade Session & Persistent Workflow:
 * - Brand identity: #B8497D, #FFFFFF, #FFF7FA, #352832, #81747C, #F0E4EA
 * - Keeps sheet open after adding so users can select and add multiple shades in one session
 * - In-bag quantity badges on swatches to visually indicate which shades are already in the bag
 * - Multi-quantity stepper ([-] <qty> [+]) for each shade
 * - Explicit Close, Done, and "View Bag (N)" navigation controls
 * - Robust deduplication and price calculation
 */
export const SelectShadeBottomSheet = ({
  visible: propVisible,
  onClose: propOnClose,
  product: propProduct,
  initialShade: propInitialShade
}) => {
  const context = useApp() || {};
  const {
    shadeSheetState,
    closeShadeSheet,
    userRole,
    getRolePrice,
    addToCart,
    cart = [],
    setCurrentScreen,
    isFavorite,
    toggleFavorite,
    rememberSelectedShade,
    lastSelectedShades = {},
    setOrderStatusNotification
  } = context;

  // Derive active visibility & product from props or global AppContext
  const isControlled = typeof propVisible === 'boolean';
  const isVisible = isControlled ? propVisible : Boolean(shadeSheetState?.isOpen);
  const activeProduct = propProduct || shadeSheetState?.product;
  const passedInitialShade = propInitialShade || shadeSheetState?.initialShade;

  const handleClose = useCallback(() => {
    if (propOnClose) {
      propOnClose();
    } else if (closeShadeSheet) {
      closeShadeSheet();
    }
  }, [propOnClose, closeShadeSheet]);

  // Extract valid shades with fallback to default curated beauty shades
  const allShades = useMemo(() => {
    const list = getSafeProductShadesList(activeProduct);
    if (list && list.length > 0) {
      return list.map((s, idx) => ({
        ...s,
        undertone: s.undertone || (DEFAULT_BEAUTY_SHADES[idx % DEFAULT_BEAUTY_SHADES.length]?.undertone) || 'Natural Luminous Finish',
        isBestseller: s.isBestseller || s.bestseller || idx < 4,
        hexColor: s.hexColor || s.hex_color || DEFAULT_BEAUTY_SHADES[idx % DEFAULT_BEAUTY_SHADES.length]?.hexColor || '#B8497D'
      }));
    }
    return DEFAULT_BEAUTY_SHADES;
  }, [activeProduct]);

  // Active filter chip: 'all' | 'bestsellers'
  const [activeFilter, setActiveFilter] = useState('all');

  // Currently selected shade
  const [selectedShade, setSelectedShade] = useState(null);
  // Quantity to add for currently selected shade
  const [selectedQty, setSelectedQty] = useState(1);

  // Success celebration state
  const [isSuccessAdded, setIsSuccessAdded] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [successToastMessage, setSuccessToastMessage] = useState(null);

  // Slide & Fade animations
  const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const backdropAnim = useRef(new Animated.Value(0)).current;

  // Initialize or restore shade when sheet opens or product changes
  useEffect(() => {
    if (isVisible && activeProduct) {
      setIsSuccessAdded(false);
      setIsAdding(false);
      setActiveFilter('all');
      setSelectedQty(1);

      if (allShades.length > 0) {
        // Priority 1: passedInitialShade
        if (passedInitialShade && allShades.some(s => (s.id || s.name) === (passedInitialShade.id || passedInitialShade.name))) {
          setSelectedShade(passedInitialShade);
        } else if (lastSelectedShades[activeProduct.id] && allShades.some(s => (s.id || s.name) === (lastSelectedShades[activeProduct.id].id || lastSelectedShades[activeProduct.id].name))) {
          // Priority 2: remembered shade for this product
          setSelectedShade(lastSelectedShades[activeProduct.id]);
        } else {
          setSelectedShade(allShades[0]);
        }
      } else {
        setSelectedShade(null);
      }

      // Animate in
      Animated.parallel([
        Animated.timing(backdropAnim, {
          toValue: 1,
          duration: 220,
          useNativeDriver: true
        }),
        Animated.spring(slideAnim, {
          toValue: 0,
          damping: 24,
          stiffness: 220,
          useNativeDriver: true
        })
      ]).start();
    } else {
      // Animate out
      Animated.parallel([
        Animated.timing(backdropAnim, {
          toValue: 0,
          duration: 180,
          useNativeDriver: true
        }),
        Animated.timing(slideAnim, {
          toValue: SCREEN_HEIGHT,
          duration: 200,
          useNativeDriver: true
        })
      ]).start();
    }
  }, [isVisible, activeProduct?.id, passedInitialShade, allShades, lastSelectedShades]);

  // Bestseller shades identification
  const bestsellerShades = useMemo(() => {
    return allShades.filter(s => s.isBestseller);
  }, [allShades]);

  // Filtered shades displayed in selection row
  const displayedShades = useMemo(() => {
    if (activeFilter === 'bestsellers') {
      return bestsellerShades;
    }
    return allShades;
  }, [activeFilter, allShades, bestsellerShades]);

  // Product Image: Updates dynamically if selected shade has specific image
  const displayImage = useMemo(() => {
    if (selectedShade?.image || selectedShade?.imageUrl) {
      return selectedShade.image || selectedShade.imageUrl;
    }
    return activeProduct?.image || '';
  }, [selectedShade, activeProduct]);

  // Cart information for the CURRENTLY selected shade
  const currentShadeCartKey = useMemo(() => {
    if (!activeProduct || !selectedShade) return null;
    return getCartKey(activeProduct.id, selectedShade);
  }, [activeProduct?.id, selectedShade]);

  const currentShadeInCart = (cart || []).find(c => c.id === currentShadeCartKey);
  const currentShadeInCartQty = currentShadeInCart ? currentShadeInCart.quantity : 0;

  // Map of all shades of this product currently in the cart
  const productShadesInCartMap = useMemo(() => {
    const map = new Map();
    (cart || []).forEach(item => {
      const pId = item.product?.id || item.productId;
      if (pId === activeProduct?.id) {
        const sId = item.shade?.id;
        const sName = item.shade?.name || item.shade?.title;
        if (sId) map.set(String(sId), item.quantity);
        if (sName) map.set(String(sName).toLowerCase(), item.quantity);
      }
    });
    return map;
  }, [cart, activeProduct?.id]);

  // Total items of this product in cart
  const totalProductUnitsInCart = useMemo(() => {
    let sum = 0;
    (cart || []).forEach(item => {
      const pId = item.product?.id || item.productId;
      if (pId === activeProduct?.id) {
        sum += (item.quantity || 0);
      }
    });
    return sum;
  }, [cart, activeProduct?.id]);

  const totalCartBadgeCount = (cart || []).reduce((sum, item) => sum + (item.quantity || 0), 0);

  // Dynamic role pricing
  const rolePrice = useMemo(() => {
    if (typeof getRolePrice === 'function' && activeProduct) {
      return getRolePrice(activeProduct, userRole, selectedShade, selectedQty);
    }
    return activeProduct?.generalPrice || activeProduct?.mrp || 254.15;
  }, [activeProduct, userRole, selectedShade, selectedQty, getRolePrice]);

  const mrp = useMemo(() => {
    if (selectedShade?.priceOverride && Number(selectedShade.priceOverride) > rolePrice) {
      return Number(selectedShade.priceOverride);
    }
    if (activeProduct?.mrp && Number(activeProduct.mrp) > rolePrice) {
      return Number(activeProduct.mrp);
    }
    return Math.round(rolePrice * 1.18);
  }, [activeProduct?.mrp, selectedShade?.priceOverride, rolePrice]);

  const discountPercent = mrp > rolePrice ? Math.round(((mrp - rolePrice) / mrp) * 100) : 15;
  const savingsAmount = (mrp > rolePrice ? (mrp - rolePrice) * selectedQty : 44.85 * selectedQty).toFixed(2);

  const isSelectedShadeSoldOut = false;
  const isLiked = isFavorite ? isFavorite(activeProduct?.id) : false;

  // Handle shade switch: update selected shade, remember it, and reset stepper
  const handleSelectShade = (shade) => {
    if (!shade) return;
    setSelectedShade(shade);
    setSelectedQty(1);
    if (rememberSelectedShade && activeProduct?.id) {
      rememberSelectedShade(activeProduct.id, shade);
    }
  };

  // Add to Bag handler (STAYS OPEN so user can select more shades!)
  const handleAddToBag = () => {
    if (!activeProduct || isSelectedShadeSoldOut || isAdding) return;

    setIsAdding(true);
    if (addToCart) {
      addToCart(activeProduct, selectedQty, selectedShade);
    }

    if (rememberSelectedShade && activeProduct?.id && selectedShade) {
      rememberSelectedShade(activeProduct.id, selectedShade);
    }

    setIsSuccessAdded(true);
    const shadeLabel = selectedShade?.name || selectedShade?.title || 'Selected shade';
    const toastMsg = `Added ${selectedQty}x ${shadeLabel} to Bag! ✨`;
    setSuccessToastMessage(toastMsg);

    if (setOrderStatusNotification) {
      setOrderStatusNotification({
        title: 'Added to Bag ✨',
        message: `${activeProduct.brandName || 'SALBEAU'} ${activeProduct.name || 'Product'} (${shadeLabel}) added (${selectedQty}x) to your shopping bag.`,
        type: 'cart'
      });
    }

    // Keep the sheet OPEN! DO NOT call handleClose()
    setTimeout(() => {
      setIsAdding(false);
      setIsSuccessAdded(false);
      setSelectedQty(1);
    }, 1200);

    setTimeout(() => {
      setSuccessToastMessage(null);
    }, 2500);
  };

  if (!isVisible) {
    return null;
  }

  const brandDisplayName = (activeProduct?.brandName || activeProduct?.brand || 'SALBEAU').toUpperCase();
  const productTitle = activeProduct?.name || 'Beauty Product';

  return (
    <Modal
      transparent
      visible={isVisible}
      animationType="none"
      statusBarTranslucent
      onRequestClose={handleClose}
    >
      <View style={styles.modalRoot}>
        {/* Dimmed Background Overlay */}
        <TouchableWithoutFeedback onPress={handleClose}>
          <Animated.View
            style={[
              styles.backdrop,
              {
                opacity: backdropAnim
              }
            ]}
          />
        </TouchableWithoutFeedback>

        {/* Bottom Sheet Container */}
        <Animated.View
          style={[
            styles.sheetContainer,
            {
              transform: [{ translateY: slideAnim }]
            }
          ]}
        >
          {/* Drag Handle */}
          <View className="items-center pt-2.5 pb-1">
            <View className="w-9 h-1 rounded-full bg-[#E5D8DF]" />
          </View>

          {/* 1. COMPACT PRODUCT HEADER */}
          <View
            style={{
              borderBottomColor: '#F0E4EA',
              borderBottomWidth: 1,
            }}
            className="px-4 pb-2.5 pt-1 flex-row items-center justify-between"
          >
            <View className="flex-1 pr-3">
              <Text
                style={{ color: '#B8497D' }}
                className="text-[10px] font-bold tracking-widest uppercase mb-0.5"
              >
                {brandDisplayName}
              </Text>
              <Text
                style={{ color: '#352832' }}
                className="text-sm font-black leading-snug"
                numberOfLines={1}
              >
                {productTitle}
              </Text>
            </View>

            <TouchableOpacity
              onPress={handleClose}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              activeOpacity={0.7}
              style={{
                width: 30,
                height: 30,
                borderRadius: 15,
                backgroundColor: '#FFF7FA',
                borderColor: '#F0E4EA',
                borderWidth: 1,
              }}
              className="items-center justify-center -mr-1"
            >
              <Ionicons name="close" size={16} color="#352832" />
            </TouchableOpacity>
          </View>

          {/* SCROLLABLE BODY */}
          <ScrollView
            showsVerticalScrollIndicator={false}
            bounces={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.scrollContent}
          >
            {/* 2. PROPORTIONALLY SCALED PRODUCT IMAGE */}
            <View
              style={{
                backgroundColor: '#FFF7FA',
                height: 132,
              }}
              className="w-full items-center justify-center px-4 relative overflow-hidden"
            >
              <Image
                source={getSafeImageSource(displayImage, '')}
                style={{ width: '85%', height: '88%' }}
                resizeMode="contain"
              />

              {discountPercent > 0 && (
                <View
                  style={{
                    backgroundColor: '#B8497D',
                    borderRadius: 6,
                    paddingHorizontal: 7,
                    paddingVertical: 3,
                  }}
                  className="absolute top-2.5 left-4 shadow-2xs"
                >
                  <Text className="text-white text-[9.5px] font-black uppercase tracking-wider">
                    {discountPercent}% OFF
                  </Text>
                </View>
              )}

              {/* Toast banner when shade is added */}
              {successToastMessage && (
                <View
                  style={{
                    backgroundColor: 'rgba(23, 23, 23, 0.92)',
                    paddingHorizontal: 12,
                    paddingVertical: 5,
                    borderRadius: 14,
                  }}
                  className="absolute bottom-2.5 flex-row items-center gap-1.5 shadow-md"
                >
                  <Ionicons name="checkmark-circle" size={14} color="#4ADE80" />
                  <Text className="text-white text-[10.5px] font-extrabold">{successToastMessage}</Text>
                </View>
              )}
            </View>

            {/* 3. SHADE FILTERS (Compact Segmented Controls) */}
            <View
              style={{
                backgroundColor: '#FFFFFF',
                borderBottomColor: '#F0E4EA',
                borderBottomWidth: 1,
              }}
              className="px-4 py-2 flex-row items-center gap-2"
            >
              <TouchableOpacity
                onPress={() => setActiveFilter('all')}
                activeOpacity={0.75}
                style={{
                  backgroundColor: activeFilter === 'all' ? '#B8497D' : '#FFFFFF',
                  borderColor: activeFilter === 'all' ? '#B8497D' : '#F0E4EA',
                  borderWidth: 1,
                }}
                className="px-3.5 py-1.5 rounded-full flex-row items-center gap-1 shadow-2xs"
              >
                <Text
                  style={{ color: activeFilter === 'all' ? '#FFFFFF' : '#352832' }}
                  className="text-[11px] font-bold"
                >
                  All Shades ({allShades.length})
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setActiveFilter('bestsellers')}
                activeOpacity={0.75}
                style={{
                  backgroundColor: activeFilter === 'bestsellers' ? '#B8497D' : '#FFFFFF',
                  borderColor: activeFilter === 'bestsellers' ? '#B8497D' : '#F0E4EA',
                  borderWidth: 1,
                }}
                className="px-3.5 py-1.5 rounded-full flex-row items-center gap-1.5 shadow-2xs"
              >
                <Ionicons
                  name="flame"
                  size={12}
                  color={activeFilter === 'bestsellers' ? '#FFFFFF' : '#B8497D'}
                />
                <Text
                  style={{ color: activeFilter === 'bestsellers' ? '#FFFFFF' : '#352832' }}
                  className="text-[11px] font-bold"
                >
                  Bestsellers ({bestsellerShades.length})
                </Text>
              </TouchableOpacity>
            </View>

            {/* 4. SELECTED SHADE BANNER & UNDERTONE */}
            <View className="px-4 pt-2.5 pb-1">
              <View className="flex-row items-center justify-between mb-0.5">
                <Text
                  style={{ color: '#352832' }}
                  className="text-xs font-bold uppercase tracking-wider"
                >
                  Select Shade
                </Text>
                {selectedShade && (
                  <View className="flex-row items-center gap-1.5">
                    <Text
                      style={{ color: '#B8497D' }}
                      className="text-xs font-black"
                    >
                      {selectedShade.name || selectedShade.title || 'Selected'}
                    </Text>
                    {currentShadeInCartQty > 0 && (
                      <View className="bg-emerald-50 border border-emerald-200 px-1.5 py-0.2 rounded-full">
                        <Text className="text-[9.5px] font-black text-emerald-700">
                          {currentShadeInCartQty} in bag
                        </Text>
                      </View>
                    )}
                  </View>
                )}
              </View>

              {selectedShade?.undertone ? (
                <Text
                  style={{ color: '#81747C' }}
                  className="text-[11px] font-medium"
                >
                  {selectedShade.undertone}
                </Text>
              ) : null}
            </View>

            {/* 5. ELEGANT CIRCULAR SHADE SWATCHES (With In-Bag Quantity Badges) */}
            <View className="px-4 py-2">
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                contentContainerStyle={{ paddingVertical: 4 }}
              >
                {displayedShades.map((shade, idx) => {
                  const isSelected = selectedShade && (
                    (selectedShade.id && shade.id && selectedShade.id === shade.id) ||
                    (selectedShade.name && shade.name && selectedShade.name === shade.name)
                  );

                  const shadeKey = shade.id ? String(shade.id) : (shade.name ? String(shade.name).toLowerCase() : '');
                  const qtyInBag = productShadesInCartMap.get(shadeKey) || 0;
                  const colorHex = shade.hexColor || shade.hex_color || '#F4A18D';

                  return (
                    <TouchableOpacity
                      key={shade.id || shade.name || idx}
                      onPress={() => handleSelectShade(shade)}
                      activeOpacity={0.8}
                      style={{
                        marginRight: 14,
                        alignItems: 'center',
                      }}
                    >
                      {/* Outer Ring & Circular Swatch Container */}
                      <View
                        style={{
                          width: 48,
                          height: 48,
                          borderRadius: 24,
                          borderColor: isSelected ? '#B8497D' : '#F0E4EA',
                          borderWidth: isSelected ? 2.5 : 1,
                          backgroundColor: '#FFFFFF',
                          alignItems: 'center',
                          justifyContent: 'center',
                          shadowColor: '#B8497D',
                          shadowOffset: { width: 0, height: 1 },
                          shadowOpacity: isSelected ? 0.2 : 0.04,
                          shadowRadius: 3,
                          elevation: isSelected ? 2 : 1,
                          position: 'relative'
                        }}
                      >
                        {/* Color Swatch Circle (38×38px) */}
                        <View
                          style={{
                            width: 38,
                            height: 38,
                            borderRadius: 19,
                            backgroundColor: colorHex,
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          {isSelected && (
                            <Ionicons name="checkmark" size={17} color="#FFFFFF" />
                          )}
                        </View>

                        {/* In-Bag Badge on Swatch */}
                        {qtyInBag > 0 && (
                          <View
                            style={{
                              position: 'absolute',
                              top: -2,
                              right: -2,
                              backgroundColor: '#B8497D',
                              minWidth: 16,
                              height: 16,
                              borderRadius: 8,
                              alignItems: 'center',
                              justifyContent: 'center',
                              paddingHorizontal: 3,
                              borderWidth: 1.5,
                              borderColor: '#FFFFFF',
                            }}
                          >
                            <Text style={{ color: '#FFFFFF', fontSize: 8.5, fontWeight: '900' }}>
                              {qtyInBag}
                            </Text>
                          </View>
                        )}
                      </View>

                      {/* Compact Shade Label */}
                      <Text
                        style={{
                          color: isSelected ? '#B8497D' : '#352832',
                          fontWeight: isSelected ? '700' : '500',
                          fontSize: 10.5,
                          marginTop: 5,
                          maxWidth: 58,
                          textAlign: 'center',
                        }}
                        numberOfLines={1}
                      >
                        {shade.name || `Shade ${idx + 1}`}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>

            {/* 6. QUANTITY STEPPER FOR CURRENT SHADE */}
            <View
              style={{
                backgroundColor: '#FFF8FA',
                borderColor: '#F0E4EA',
                borderWidth: 1,
                borderRadius: 14,
              }}
              className="mx-4 my-1.5 p-2.5 flex-row items-center justify-between"
            >
              <View>
                <Text style={{ color: '#352832' }} className="text-xs font-black">
                  Quantity
                </Text>
                <Text style={{ color: '#81747C' }} className="text-[10px] mt-0.5">
                  {currentShadeInCartQty > 0
                    ? `Already ${currentShadeInCartQty} in bag • Add more units below`
                    : 'Select units to add for this shade'}
                </Text>
              </View>

              {/* Stepper controls */}
              <View className="flex-row items-center bg-white rounded-xl border border-[#F0E4EA] p-1 shadow-2xs">
                <TouchableOpacity
                  onPress={() => setSelectedQty(prev => Math.max(1, prev - 1))}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  activeOpacity={0.7}
                  className="w-7 h-7 rounded-lg bg-[#FFF0F5] items-center justify-center"
                >
                  <Ionicons name="remove" size={14} color="#B8497D" />
                </TouchableOpacity>

                <Text className="text-xs font-black text-[#352832] px-3 min-w-[28px] text-center">
                  {selectedQty}
                </Text>

                <TouchableOpacity
                  onPress={() => setSelectedQty(prev => prev + 1)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  activeOpacity={0.7}
                  className="w-7 h-7 rounded-lg bg-[#FFF0F5] items-center justify-center"
                >
                  <Ionicons name="add" size={14} color="#B8497D" />
                </TouchableOpacity>
              </View>
            </View>

            {/* 7. PRICING & SAVINGS SECTION */}
            <View
              style={{
                backgroundColor: '#FFF7FA',
                borderColor: '#F0E4EA',
                borderWidth: 1,
                borderRadius: 14,
              }}
              className="mx-4 my-1.5 p-3"
            >
              <View className="flex-row items-baseline gap-2 flex-wrap">
                <Text
                  style={{ color: '#352832' }}
                  className="text-lg font-black"
                >
                  ₹{(Number(rolePrice) * selectedQty).toFixed(2)}
                </Text>
                {mrp > rolePrice && (
                  <Text
                    style={{ color: '#81747C' }}
                    className="text-xs font-semibold line-through"
                  >
                    ₹{(Number(mrp) * selectedQty).toFixed(2)}
                  </Text>
                )}
                {discountPercent > 0 && (
                  <Text
                    style={{ color: '#B8497D' }}
                    className="text-xs font-black"
                  >
                    {discountPercent}% OFF
                  </Text>
                )}
                {savingsAmount > 0 && (
                  <Text
                    style={{ color: '#B8497D' }}
                    className="text-xs font-bold ml-auto"
                  >
                    Save ₹{savingsAmount}
                  </Text>
                )}
              </View>
              <Text
                style={{ color: '#81747C' }}
                className="text-[10px] font-medium mt-0.5"
              >
                Inclusive of all taxes
              </Text>
            </View>
          </ScrollView>

          {/* 8. PURCHASE & MULTI-SHADE SESSION BAR */}
          <View style={styles.bottomBar}>
            {/* Row 1: Wishlist + Add to Bag */}
            <View className="flex-row items-center w-full gap-2.5">
              {toggleFavorite && (
                <TouchableOpacity
                  onPress={() => toggleFavorite(activeProduct)}
                  activeOpacity={0.7}
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 14,
                    backgroundColor: '#FFF7FA',
                    borderColor: '#F0E4EA',
                    borderWidth: 1,
                  }}
                  className="items-center justify-center shadow-2xs"
                >
                  <Ionicons
                    name={isLiked ? 'heart' : 'heart-outline'}
                    size={20}
                    color="#B8497D"
                  />
                </TouchableOpacity>
              )}

              {/* Add to Bag CTA (Does NOT close sheet so user can add more shades!) */}
              <TouchableOpacity
                onPress={handleAddToBag}
                disabled={!selectedShade || isSelectedShadeSoldOut || isAdding}
                activeOpacity={0.88}
                style={{
                  height: 48,
                  backgroundColor: (!selectedShade || isSelectedShadeSoldOut) ? '#CBD5E1' : '#B8497D',
                  shadowColor: '#B8497D',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.25,
                  shadowRadius: 5,
                  elevation: 3,
                  borderRadius: 14,
                }}
                className="flex-1 flex-row items-center justify-center gap-2 px-4 active:scale-98"
              >
                {isSuccessAdded ? (
                  <>
                    <Ionicons name="checkmark-circle" size={17} color="#FFFFFF" />
                    <Text className="text-white text-xs font-black uppercase tracking-wider">
                      Added! Choose More
                    </Text>
                  </>
                ) : isSelectedShadeSoldOut ? (
                  <Text className="text-white text-xs font-black uppercase tracking-wider">
                    Sold Out
                  </Text>
                ) : (
                  <>
                    <Ionicons name="bag-handle" size={16} color="#FFFFFF" />
                    <Text className="text-white text-xs font-black uppercase tracking-wider">
                      {currentShadeInCartQty > 0
                        ? `Add ${selectedQty} More to Bag`
                        : `Add to Bag • ₹${(rolePrice * selectedQty).toFixed(2)}`}
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </View>

            {/* Row 2: Multi-Shade Navigation Summary (When items are in cart) */}
            {totalProductUnitsInCart > 0 && (
              <View className="flex-row items-center justify-between w-full mt-2 pt-2 border-t border-[#F0E4EA]">
                <View className="flex-row items-center gap-1.5">
                  <Ionicons name="bag-check" size={14} color="#B8497D" />
                  <Text style={{ color: '#352832', fontSize: 11, fontWeight: '700' }}>
                    {totalProductUnitsInCart} {totalProductUnitsInCart === 1 ? 'item' : 'items'} of this product in Bag
                  </Text>
                </View>

                <View className="flex-row items-center gap-2">
                  <TouchableOpacity
                    onPress={handleClose}
                    activeOpacity={0.75}
                    className="px-3 py-1.5 rounded-xl bg-gray-100"
                  >
                    <Text style={{ color: '#4B5563', fontSize: 11, fontWeight: '800' }}>
                      Done
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => {
                      handleClose();
                      if (setCurrentScreen) setCurrentScreen('cart');
                    }}
                    activeOpacity={0.75}
                    className="px-3 py-1.5 rounded-xl bg-[#FFF0F5] border border-[#F8B4D9] flex-row items-center gap-1"
                  >
                    <Text style={{ color: '#B8497D', fontSize: 11, fontWeight: '800' }}>
                      View Bag ({totalCartBadgeCount}) ↗
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalRoot: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'transparent'
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.52)'
  },
  sheetContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: Math.round(SCREEN_HEIGHT * 0.85),
    width: '100%',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 20
  },
  scrollContent: {
    paddingBottom: 12
  },
  bottomBar: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F0E4EA',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: Platform.OS === 'ios' ? 24 : 12,
    flexDirection: 'column',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 5
  }
});

export default SelectShadeBottomSheet;
