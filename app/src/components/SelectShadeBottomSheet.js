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
import { getSafeProductShadesList } from '../utils/cartKeyUtils';

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
 * Redesigned for modern, premium, intuitive beauty ecommerce:
 * - Brand identity: #B8497D, #FFFFFF, #FFF7FA, #352832, #81747C, #F0E4EA
 * - Compact Header with brand label & close button
 * - Proportional packshot image container (reduced by ~22% for optimal ergonomics)
 * - Accessible 44×44px circular swatches with outer ring & checkmark
 * - Segmented filters: "All Shades" & "Bestsellers"
 * - Compact Pricing with savings highlight & tax note
 * - Sticky Bottom Purchase Bar (52px CTA, wishlist heart, safe-area padding)
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
    isFavorite,
    toggleFavorite,
    rememberSelectedShade,
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

  // Success celebration state
  const [isSuccessAdded, setIsSuccessAdded] = useState(false);
  const [isAdding, setIsAdding] = useState(false);

  // Slide & Fade animations
  const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const backdropAnim = useRef(new Animated.Value(0)).current;

  // Initialize or restore shade when sheet opens or product changes
  useEffect(() => {
    if (isVisible && activeProduct) {
      setIsSuccessAdded(false);
      setIsAdding(false);
      setActiveFilter('all');

      if (allShades.length > 0) {
        if (passedInitialShade && allShades.some(s => (s.id || s.name) === (passedInitialShade.id || passedInitialShade.name))) {
          setSelectedShade(passedInitialShade);
        } else {
          const firstInStock = allShades.find(s => s.inStock !== false && s.soldOut !== true && s.stock !== 0);
          setSelectedShade(firstInStock || allShades[0]);
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
  }, [isVisible, activeProduct?.id, passedInitialShade, allShades]);

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

  // Dynamic role pricing
  const rolePrice = useMemo(() => {
    if (typeof getRolePrice === 'function' && activeProduct) {
      return getRolePrice(activeProduct, userRole, selectedShade, 1);
    }
    return activeProduct?.generalPrice || activeProduct?.mrp || 254.15;
  }, [activeProduct, userRole, selectedShade, getRolePrice]);

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
  const savingsAmount = (mrp > rolePrice ? mrp - rolePrice : 44.85).toFixed(2);

  const isSelectedShadeSoldOut = useMemo(() => {
    if (!selectedShade) return false;
    return (
      selectedShade.inStock === false ||
      selectedShade.soldOut === true ||
      selectedShade.stock === 0 ||
      selectedShade.status === 'out_of_stock'
    );
  }, [selectedShade]);

  const isLiked = isFavorite ? isFavorite(activeProduct?.id) : false;

  // Add to Bag handler
  const handleAddToBag = () => {
    if (!activeProduct || isSelectedShadeSoldOut || isAdding) return;

    setIsAdding(true);
    if (addToCart) {
      addToCart(activeProduct, 1, selectedShade);
    }

    if (rememberSelectedShade && activeProduct?.id && selectedShade) {
      rememberSelectedShade(activeProduct.id, selectedShade);
    }

    setIsSuccessAdded(true);

    if (setOrderStatusNotification) {
      const shadeLabel = selectedShade?.name || selectedShade?.title || 'Selected shade';
      setOrderStatusNotification({
        title: 'Added to Bag ✨',
        message: `${activeProduct.brandName || 'SALBEAU'} ${activeProduct.name || 'Product'} (${shadeLabel}) added to your shopping bag.`,
        type: 'cart'
      });
    }

    setTimeout(() => {
      setIsAdding(false);
      handleClose();
    }, 450);
  };

  if (!isVisible) {
    return null;
  }

  const brandDisplayName = (activeProduct?.brandName || activeProduct?.brand || 'SALBEAU').toUpperCase();
  const productTitle = activeProduct?.name || 'Demo Blush Plus';

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
            {/* 2. PROPORTIONALLY SCALED PRODUCT IMAGE (Reduced height ~22% for clean ergonomics) */}
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
            </View>

            {/* 3. SHADE FILTERS (Compact Segmented Controls) */}
            <View
              style={{
                backgroundColor: '#FFFFFF',
                borderBottomColor: '#F0E4EA',
                borderBottomWidth: 1,
              }}
              className="px-4 py-2.5 flex-row items-center gap-2"
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
            <View className="px-4 pt-3 pb-1">
              <View className="flex-row items-center justify-between mb-1">
                <Text
                  style={{ color: '#352832' }}
                  className="text-xs font-bold uppercase tracking-wider"
                >
                  Select Shade
                </Text>
                {selectedShade && (
                  <Text
                    style={{ color: '#B8497D' }}
                    className="text-xs font-extrabold"
                  >
                    {selectedShade.name || selectedShade.title || 'Selected'}
                  </Text>
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

            {/* 5. ELEGANT CIRCULAR SHADE SWATCHES (Accessible touch targets >= 44×44px) */}
            <View className="px-4 py-2.5">
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

                  const isSoldOut = (
                    shade.inStock === false ||
                    shade.soldOut === true ||
                    shade.stock === 0 ||
                    shade.status === 'out_of_stock'
                  );

                  const colorHex = shade.hexColor || shade.hex_color || '#F4A18D';

                  return (
                    <TouchableOpacity
                      key={shade.id || shade.name || idx}
                      onPress={() => setSelectedShade(shade)}
                      activeOpacity={0.8}
                      style={{
                        marginRight: 14,
                        alignItems: 'center',
                        opacity: isSoldOut ? 0.45 : 1,
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
                        }}
                      >
                        {/* Color Swatch Circle (40×40px) */}
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

            {/* 6. PRICING & SAVINGS SECTION */}
            <View
              style={{
                backgroundColor: '#FFF7FA',
                borderColor: '#F0E4EA',
                borderWidth: 1,
                borderRadius: 14,
              }}
              className="mx-4 my-2 p-3"
            >
              <View className="flex-row items-baseline gap-2 flex-wrap">
                <Text
                  style={{ color: '#352832' }}
                  className="text-lg font-black"
                >
                  ₹{Number(rolePrice).toFixed(2)}
                </Text>
                {mrp > rolePrice && (
                  <Text
                    style={{ color: '#81747C' }}
                    className="text-xs font-semibold line-through"
                  >
                    ₹{Number(mrp).toFixed(2)}
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
                className="text-[10px] font-medium mt-1"
              >
                Inclusive of all taxes
              </Text>
            </View>
          </ScrollView>

          {/* 7. STICKY BOTTOM PURCHASE BAR (Height 52-56px, Safe-Area Inset) */}
          <View style={styles.bottomBar}>
            {/* Wishlist Toggle Button */}
            {toggleFavorite && (
              <TouchableOpacity
                onPress={() => toggleFavorite(activeProduct)}
                activeOpacity={0.7}
                style={{
                  width: 52,
                  height: 52,
                  borderRadius: 14,
                  backgroundColor: '#FFF7FA',
                  borderColor: '#F0E4EA',
                  borderWidth: 1,
                }}
                className="items-center justify-center mr-3 shadow-2xs"
              >
                <Ionicons
                  name={isLiked ? 'heart' : 'heart-outline'}
                  size={22}
                  color="#B8497D"
                />
              </TouchableOpacity>
            )}

            {/* Prominent "Add to Bag" Button (Height: 52px) */}
            <TouchableOpacity
              onPress={handleAddToBag}
              disabled={!selectedShade || isSelectedShadeSoldOut || isAdding}
              activeOpacity={0.88}
              style={{
                height: 52,
                backgroundColor: (!selectedShade || isSelectedShadeSoldOut) ? '#CBD5E1' : '#B8497D',
                shadowColor: '#B8497D',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.25,
                shadowRadius: 5,
                elevation: 3,
                borderRadius: 14,
              }}
              className="flex-1 flex-row items-center justify-center gap-2 px-6"
            >
              {isSuccessAdded ? (
                <>
                  <Ionicons name="checkmark-circle" size={19} color="#FFFFFF" />
                  <Text className="text-white text-xs font-black uppercase tracking-wider">
                    Added to Bag!
                  </Text>
                </>
              ) : isSelectedShadeSoldOut ? (
                <Text className="text-white text-xs font-black uppercase tracking-wider">
                  Sold Out
                </Text>
              ) : (
                <>
                  <Ionicons name="bag-handle" size={18} color="#FFFFFF" />
                  <Text className="text-white text-xs font-black uppercase tracking-wider">
                    Add to Bag
                  </Text>
                </>
              )}
            </TouchableOpacity>
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
    maxHeight: Math.round(SCREEN_HEIGHT * 0.82),
    width: '100%',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 20
  },
  scrollContent: {
    paddingBottom: 16
  },
  bottomBar: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F0E4EA',
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: Platform.OS === 'ios' ? 28 : 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 5
  }
});

export default SelectShadeBottomSheet;
