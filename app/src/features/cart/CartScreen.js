import React, { useState, useMemo, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, TextInput, Alert, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../../context/AppContext';
import { getSafeImageSource } from '../../utils/imageUtils';
import { getAddOnRecommendations, getSafeProductShades } from '../../utils/recommendationEngine';

export const CartScreen = () => {
  const {
    cart,
    addToCart,
    updateCartQuantity,
    removeFromCart,
    clearCart,
    userRole,
    getRolePrice,
    setCurrentScreen,
    activeProducts,
    recommendationConfig,
    setSelectedProduct
  } = useApp();

  const [couponCode, setCouponCode] = useState('');
  const [couponApplied, setCouponApplied] = useState(false);
  const [discountAmount, setDiscountAmount] = useState(350);

  const [quickShadeModalItem, setQuickShadeModalItem] = useState(null);
  const [selectedQuickShade, setSelectedQuickShade] = useState(null);
  const [addedToastMessage, setAddedToastMessage] = useState(null);
  const [locallyAddedIds, setLocallyAddedIds] = useState([]);

  useEffect(() => {
    if (addedToastMessage) {
      const timer = setTimeout(() => setAddedToastMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [addedToastMessage]);

  const cartAddOns = useMemo(() => {
    if (recommendationConfig?.enabled === false || !cart || cart.length === 0) return [];
    const recs = getAddOnRecommendations(cart, activeProducts, cart, {
      maxCount: (recommendationConfig?.maxAddOns || 8) + locallyAddedIds.length,
      frequentlyBoughtTogether: recommendationConfig?.frequentlyBoughtTogether !== false,
      popularProductsFallback: recommendationConfig?.popularProductsFallback !== false
    });
    return recs.filter(p => !locallyAddedIds.includes(p.id)).slice(0, recommendationConfig?.maxAddOns || 8);
  }, [cart, activeProducts, recommendationConfig, locallyAddedIds]);

  const handleAddOnPress = (product) => {
    const subItems = getSafeProductShades(product);
    if (subItems.length > 1) {
      setQuickShadeModalItem(product);
      setSelectedQuickShade(subItems[0]);
    } else {
      const chosenShade = subItems.length === 1 ? subItems[0] : null;
      addToCart(product, 1, chosenShade);
      setLocallyAddedIds(prev => [...prev, product.id]);
      setAddedToastMessage(`Added ${product.name} to cart! ✨`);
    }
  };

  const handleConfirmQuickShadeAdd = () => {
    if (!quickShadeModalItem) return;
    addToCart(quickShadeModalItem, 1, selectedQuickShade);
    setLocallyAddedIds(prev => [...prev, quickShadeModalItem.id]);
    setAddedToastMessage(`Added ${quickShadeModalItem.name}${selectedQuickShade ? ` (${selectedQuickShade.name})` : ''} to cart! ✨`);
    setQuickShadeModalItem(null);
    setSelectedQuickShade(null);
  };

  const { totalItemCount, mrpTotal, bagTotal } = useMemo(() => {
    let count = 0;
    let mrp = 0;
    let bag = 0;

    for (const item of cart) {
      count += item.quantity;
      const rolePrice = getRolePrice(item.product, userRole, item.shade, item.quantity);
      const originalMrp = item.product.mrp > rolePrice ? item.product.mrp : Math.round(item.product.mrp * 1.25);
      mrp += (originalMrp * item.quantity);
      bag += (rolePrice * item.quantity);
    }

    return { totalItemCount: count, mrpTotal: mrp, bagTotal: bag };
  }, [cart, userRole, getRolePrice]);

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

  const handleClearAll = () => {
    Alert.alert(
      'Clear Entire Cart',
      `Are you sure you want to remove all ${totalItemCount} item${totalItemCount > 1 ? 's' : ''} from your cart?`,
      [
        { text: 'Keep Items', style: 'cancel' },
        {
          text: 'Yes, Clear All',
          style: 'destructive',
          onPress: () => clearCart()
        }
      ]
    );
  };

  return (
    <View className="flex-1 bg-white">
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 110 }} className="bg-white">
        {/* Header Title & Clear All Button */}
        <View className="flex-row items-center justify-between mb-4 mt-1">
          <Text className="text-2xl font-black text-[#3A2430]">
            My Cart ({totalItemCount})
          </Text>
          <TouchableOpacity
            onPress={handleClearAll}
            className="flex-row items-center gap-1.5 bg-rose-50 border border-rose-200 px-3 py-1.5 rounded-full"
            activeOpacity={0.8}
          >
            <Ionicons name="trash-outline" size={14} color="#E11D48" />
            <Text className="text-xs font-bold text-rose-600">Clear All</Text>
          </TouchableOpacity>
        </View>

        {/* Cart Item Cards */}
        {cart.map((item) => {
          const { product, quantity, shade } = item;
          const cartItemId = item.id || (shade ? `${product.id}_${shade.id || shade.name}` : product.id);
          const rolePrice = getRolePrice(product, userRole, shade, quantity);
          const shadeMrp = shade?.mrp || shade?.priceOverride || product.mrp;
          const originalMrp = shadeMrp > rolePrice ? shadeMrp : Math.round(shadeMrp * 1.25);
          const shadeText = shade ? `Shade: ${shade.name}` : (product.category ? `Category: ${product.category}` : '');

          return (
            <View
              key={cartItemId}
              className="bg-white rounded-3xl border border-[#FCE4EC] p-3 mb-3.5 flex-row items-center gap-3 shadow-2xs"
            >
              {/* Product Image Stage */}
              <View className="w-20 h-20 rounded-2xl overflow-hidden bg-[#FCE4EC] justify-center items-center">
                <Image
                  source={getSafeImageSource(item.shade?.image || product.image, 'https://images.unsplash.com/photo-1625093742435-6fa192b6fb10?w=400')}
                  className="w-full h-full object-cover"
                />
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
                {shade ? (
                  <View className="flex-row items-center gap-1.5 mb-2">
                    <View
                      style={{ backgroundColor: shade.hexColor || '#CE4270' }}
                      className="w-2.5 h-2.5 rounded-full border border-gray-200"
                    />
                    <Text className="text-[10px] font-bold text-violet-800">
                      {shade.name}
                    </Text>
                  </View>
                ) : (
                  <Text className="text-[10px] font-medium text-[#8C7078] mb-2">
                    {shadeText}
                  </Text>
                )}

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
                      onPress={() => updateCartQuantity(cartItemId, quantity - 1)}
                      className="w-6 h-6 rounded-full bg-white items-center justify-center border border-[#FCE4EC]"
                    >
                      <Ionicons name="remove" size={12} color="#C2477A" />
                    </TouchableOpacity>

                    <Text className="text-xs font-extrabold text-[#3A2430] px-2 min-w-[20px] text-center">
                      {quantity}
                    </Text>

                    <TouchableOpacity
                      onPress={() => updateCartQuantity(cartItemId, quantity + 1)}
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

        {/* ── COMPLETE YOUR ORDER ✨ (AUTOMATIC ADD-ONS) ── */}
        {cartAddOns.length > 0 && (
          <View className="bg-white rounded-3xl border border-[#FCE4EC] py-4 mb-4 shadow-2xs">
            <View className="px-4 flex-row items-center justify-between mb-3">
              <View className="flex-row items-center gap-1.5">
                <View className="w-6 h-6 rounded-lg bg-[#FFF0F5] items-center justify-center border border-[#FCE4EC]">
                  <Ionicons name="sparkles" size={13} color="#C2477A" />
                </View>
                <View>
                  <Text className="text-xs font-black text-[#3A2430] uppercase tracking-wide">
                    Complete Your Order ✨
                  </Text>
                  <Text className="text-[9.5px] text-[#8C7078]">
                    Complementary additions based on your bag
                  </Text>
                </View>
              </View>
              <View className="bg-[#FFF0F5] px-2 py-0.5 rounded-full border border-[#FCE4EC]">
                <Text className="text-[10px] font-bold text-[#C2477A]">{cartAddOns.length}</Text>
              </View>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 16 }}
              className="flex-row"
            >
              {cartAddOns.map((p) => {
                const subItems = getSafeProductShades(p);
                const pPrice = getRolePrice(p, userRole, subItems[0] || null, 1);
                const pMrp = p.mrp > pPrice ? Number(p.mrp) : Math.round(pPrice * 1.25);

                return (
                  <View
                    key={p.id}
                    className="w-36 mr-3 bg-white border border-[#FCE4EC] rounded-2xl p-2.5 shadow-2xs flex-col justify-between"
                  >
                    <TouchableOpacity
                      activeOpacity={0.85}
                      onPress={() => {
                        setSelectedProduct(p);
                        setCurrentScreen('product_detail');
                      }}
                      className="relative w-full h-24 rounded-xl overflow-hidden mb-1.5 bg-[#FFF5F8] border border-[#FCE4EC]/60 items-center justify-center"
                    >
                      <Image
                        source={getSafeImageSource(subItems[0]?.image || p.image, 'https://images.unsplash.com/photo-1625093742435-6fa192b6fb10?w=300')}
                        className="w-full h-full object-cover"
                        resizeMode="cover"
                      />
                      {subItems.length > 1 && (
                        <View className="absolute bottom-1 right-1 bg-black/60 px-1.5 py-0.5 rounded-md flex-row items-center gap-1">
                          <Ionicons name="color-palette" size={9} color="#FFF" />
                          <Text className="text-[8.5px] font-bold text-white">{subItems.length}</Text>
                        </View>
                      )}
                    </TouchableOpacity>

                    <View className="flex-1">
                      <Text className="text-[8.5px] font-extrabold text-[#C2477A] uppercase tracking-wider" numberOfLines={1}>
                        {p.brandName || p.category || 'Salbeau'}
                      </Text>
                      <Text className="text-[11px] font-bold text-[#3A2430] leading-tight mb-1" numberOfLines={2}>
                        {p.name}
                      </Text>

                      {subItems.length > 1 ? (
                        <Text className="text-[9px] font-semibold text-violet-700 bg-violet-50 px-1.5 py-0.5 rounded border border-violet-100 mb-1.5 self-start">
                          {subItems.length} shades
                        </Text>
                      ) : subItems.length === 1 ? (
                        <Text className="text-[9px] font-medium text-[#8C7078] mb-1.5" numberOfLines={1}>
                          Shade: {subItems[0].name}
                        </Text>
                      ) : (
                        <Text className="text-[9px] font-medium text-[#8C7078] mb-1.5" numberOfLines={1}>
                          {p.category || 'Standard'}
                        </Text>
                      )}

                      <View className="flex-row items-baseline gap-1 mb-2">
                        <Text className="text-xs font-black text-[#C2477A]">₹{pPrice}</Text>
                        {pMrp > pPrice && (
                          <Text className="text-[9px] text-[#8C7078] line-through">₹{pMrp}</Text>
                        )}
                      </View>
                    </View>

                    <TouchableOpacity
                      activeOpacity={0.85}
                      onPress={() => handleAddOnPress(p)}
                      className="w-full py-1.5 rounded-xl bg-[#C2477A] active:bg-[#a83765] flex-row items-center justify-center gap-1 shadow-2xs"
                    >
                      <Ionicons name="add" size={12} color="#FFFFFF" />
                      <Text className="text-[10px] font-black text-white">
                        {subItems.length > 1 ? '+ Select' : '+ Add'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                );
              })}
            </ScrollView>
          </View>
        )}

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

      {/* Floating Success Toast */}
      {addedToastMessage && (
        <View style={{ top: 56 }} className="absolute left-4 right-4 z-50 bg-[#3A2430] py-2.5 px-4 rounded-2xl flex-row items-center justify-between shadow-2xl border border-[#C2477A]/40">
          <View className="flex-row items-center gap-2 flex-1 mr-2">
            <Ionicons name="sparkles" size={16} color="#FCE4EC" />
            <Text className="text-white text-xs font-bold" numberOfLines={1}>
              {addedToastMessage}
            </Text>
          </View>
          <TouchableOpacity onPress={() => setAddedToastMessage(null)}>
            <Ionicons name="close-circle" size={18} color="#FCE4EC" />
          </TouchableOpacity>
        </View>
      )}

      {/* Quick Shade Selection Modal */}
      {quickShadeModalItem && (
        <Modal
          transparent
          visible={Boolean(quickShadeModalItem)}
          animationType="slide"
          onRequestClose={() => setQuickShadeModalItem(null)}
        >
          <View className="flex-1 bg-black/60 justify-end">
            <View className="bg-white rounded-t-3xl border-t border-[#FCE4EC] p-5 shadow-2xl max-h-[80%]">
              {/* Modal Header */}
              <View className="flex-row items-center justify-between pb-3 border-b border-[#FCE4EC]">
                <View className="flex-row items-center gap-2">
                  <View className="w-8 h-8 rounded-full bg-[#FFF0F5] items-center justify-center border border-[#FCE4EC]">
                    <Ionicons name="sparkles" size={15} color="#C2477A" />
                  </View>
                  <View>
                    <Text className="text-xs font-black text-[#3A2430] uppercase">Select Your Shade</Text>
                    <Text className="text-[10px] text-[#8C7078] max-w-[220px]" numberOfLines={1}>
                      {quickShadeModalItem.name}
                    </Text>
                  </View>
                </View>
                <TouchableOpacity
                  onPress={() => setQuickShadeModalItem(null)}
                  className="w-8 h-8 rounded-full bg-gray-100 items-center justify-center"
                >
                  <Ionicons name="close" size={18} color="#3A2430" />
                </TouchableOpacity>
              </View>

              {/* Selected Shade Preview */}
              {selectedQuickShade && (
                <View className="flex-row items-center gap-3 bg-[#FFF5F8] p-3 rounded-2xl border border-[#FCE4EC] my-3">
                  <Image
                    source={getSafeImageSource(selectedQuickShade.image || quickShadeModalItem.image, 'https://images.unsplash.com/photo-1586495777744-4413f21062fa?w=300')}
                    className="w-12 h-12 rounded-xl object-cover border border-[#FCE4EC]"
                  />
                  <View className="flex-1">
                    <View className="flex-row items-center gap-1.5">
                      {selectedQuickShade.hexColor && (
                        <View
                          style={{ backgroundColor: selectedQuickShade.hexColor }}
                          className="w-3.5 h-3.5 rounded-full border border-white shadow-2xs"
                        />
                      )}
                      <Text className="text-xs font-extrabold text-[#3A2430]">
                        {selectedQuickShade.name}
                      </Text>
                    </View>
                    <Text className="text-sm font-black text-[#C2477A] mt-0.5">
                      ₹{getRolePrice(quickShadeModalItem, userRole, selectedQuickShade, 1)}
                    </Text>
                  </View>
                </View>
              )}

              {/* Shades Horizontal List */}
              <Text className="text-[10px] font-black text-[#8C7078] uppercase tracking-wider mb-2">
                Available Options ({getSafeProductShades(quickShadeModalItem).length})
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row mb-4">
                {getSafeProductShades(quickShadeModalItem).map((shade, idx) => {
                  const isSel = selectedQuickShade && (selectedQuickShade.id === shade.id || selectedQuickShade.name === shade.name);
                  const sPrice = getRolePrice(quickShadeModalItem, userRole, shade, 1);
                  return (
                    <TouchableOpacity
                      key={shade.id || idx}
                      activeOpacity={0.85}
                      onPress={() => setSelectedQuickShade(shade)}
                      className={`mr-2.5 p-2 rounded-2xl border items-center w-24 ${
                        isSel ? 'bg-[#FFF0F5] border-[#C2477A]' : 'bg-white border-[#FCE4EC]'
                      }`}
                    >
                      <View className="relative w-16 h-16 rounded-xl overflow-hidden mb-1 bg-[#FFF5F8] items-center justify-center">
                        <Image
                          source={getSafeImageSource(shade.image || quickShadeModalItem.image, 'https://images.unsplash.com/photo-1586495777744-4413f21062fa?w=200')}
                          className="w-full h-full object-cover"
                        />
                        {shade.hexColor && (
                          <View
                            style={{ backgroundColor: shade.hexColor }}
                            className="absolute bottom-1 right-1 w-3.5 h-3.5 rounded-full border border-white"
                          />
                        )}
                        {isSel && (
                          <View className="absolute top-1 left-1 bg-[#C2477A] w-4 h-4 rounded-full items-center justify-center">
                            <Ionicons name="checkmark" size={10} color="#FFF" />
                          </View>
                        )}
                      </View>
                      <Text className={`text-[10px] font-bold text-center ${isSel ? 'text-[#C2477A]' : 'text-[#3A2430]'}`} numberOfLines={1}>
                        {shade.name}
                      </Text>
                      <Text className="text-[10px] font-black text-[#C2477A] mt-0.5">₹{sPrice}</Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              {/* Confirm Button */}
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={handleConfirmQuickShadeAdd}
                className="w-full py-3.5 rounded-2xl bg-[#C2477A] items-center justify-center shadow-md flex-row gap-2"
              >
                <Ionicons name="bag-add" size={16} color="#FFFFFF" />
                <Text className="text-xs font-black text-white uppercase tracking-wider">
                  Add {selectedQuickShade ? selectedQuickShade.name : 'Selected'} To Bag • ₹{getRolePrice(quickShadeModalItem, userRole, selectedQuickShade, 1)}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
};
