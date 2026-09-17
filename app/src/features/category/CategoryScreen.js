import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image } from 'react-native';
import { useApp } from '../../context/AppContext';

export const CategoryScreen = () => {
  const {
    categories,
    selectedCategory,
    setSelectedCategory,
    activeProducts,
    userRole,
    getRolePrice,
    setSelectedProduct,
    setCurrentScreen,
    addToCart,
    updateCartQuantity,
    removeFromCart,
    cart
  } = useApp();

  const [activeCat, setActiveCat] = useState(
    selectedCategory || (categories && categories.length > 0 ? categories[0] : null)
  );

  useEffect(() => {
    if (selectedCategory) {
      setActiveCat(selectedCategory);
    } else if (categories && categories.length > 0 && !activeCat) {
      setActiveCat(categories[0]);
    }
  }, [selectedCategory, categories]);

  const handleSelectCategory = (cat) => {
    setActiveCat(cat);
    if (setSelectedCategory) setSelectedCategory(cat);
  };

  const handleIncrement = (product, currentQty) => {
    if (product.stock === 0) return;
    if (currentQty === 0) {
      addToCart(product, 1);
    } else {
      updateCartQuantity(product.id, currentQty + 1);
    }
  };

  const handleDecrement = (productId, currentQty) => {
    if (currentQty > 1) {
      updateCartQuantity(productId, currentQty - 1);
    } else if (currentQty === 1) {
      removeFromCart(productId);
    }
  };

  const filteredProducts = activeProducts.filter(p => {
    if (!activeCat) return true;
    const pCat = (p.category || '').toLowerCase();
    const cCat = (activeCat.name || '').toLowerCase();
    if (cCat.includes('lipstick')) return pCat.includes('lipstick');
    return pCat.includes(cCat) || cCat.includes(pCat);
  });

  return (
    <View className="flex-1 bg-white">
      {/* Header */}
      <View className="px-4 py-3 bg-white border-b border-gray-100 flex-row justify-between items-center">
        <TouchableOpacity onPress={() => setCurrentScreen('home')}>
          <Text className="text-xs font-bold text-[#C2477A]">← Home</Text>
        </TouchableOpacity>
        <Text className="text-sm font-extrabold text-[#3A2430] uppercase">Categories</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Two-Pane Body Container */}
      <View className="flex-1 flex-row bg-white">
        {/* Left Rail (Slim 72px column) */}
        <ScrollView
          style={{ width: 72, minWidth: 72, maxWidth: 72, flex: 0, flexGrow: 0, flexShrink: 0 }}
          className="bg-white border-r border-gray-100 py-2"
        >
          {(categories || []).map((cat) => {
            const isSelected = activeCat && (activeCat.id === cat.id || activeCat.name.toLowerCase() === cat.name.toLowerCase());
            return (
              <TouchableOpacity
                key={cat.id || cat.name}
                onPress={() => handleSelectCategory(cat)}
                className="relative items-center justify-center py-2.5 px-1 mb-2"
              >
                {/* Active Indicator Bar on Right Edge */}
                {isSelected && (
                  <View style={{ position: 'absolute', right: 0, top: 4, bottom: 4, width: 4, backgroundColor: '#C2477A', borderTopLeftRadius: 4, borderBottomLeftRadius: 4 }} />
                )}

                {/* Circular Image/Icon Bubble */}
                <View
                  className={`w-12 h-12 rounded-full overflow-hidden items-center justify-center ${
                    isSelected ? 'bg-white border-2 border-[#C2477A]' : 'bg-white border border-gray-100'
                  }`}
                >
                  {cat.image ? (
                    <Image source={{ uri: cat.image }} className="w-full h-full rounded-full" />
                  ) : (
                    <Text className={`text-lg ${isSelected ? 'text-[#C2477A]' : 'text-[#3A2430]'}`}>
                      {cat.icon || '💄'}
                    </Text>
                  )}
                </View>

                {/* Category Label */}
                <Text
                  className={`text-[9px] text-center leading-tight mt-1 px-0.5 ${
                    isSelected ? 'font-black text-[#C2477A]' : 'font-semibold text-[#8C7078]'
                  }`}
                  numberOfLines={2}
                >
                  {cat.name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Right Pane (White Background, Product Grid) */}
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ padding: 6, paddingBottom: 90 }}
          className="bg-white"
        >
          {/* 2-Column Product Grid */}
          <View className="flex-row flex-wrap justify-between">
            {filteredProducts.length === 0 ? (
              <View className="w-full p-6 bg-white rounded-2xl border border-gray-100 items-center mt-2">
                <Text className="text-xs text-[#8C7078] font-medium">No items found in this category.</Text>
              </View>
            ) : (
              filteredProducts.map(p => {
                const rolePrice = getRolePrice(p, userRole);
                const displayMrp = p.mrp && p.mrp > rolePrice ? p.mrp : Math.round(rolePrice * 1.25);
                const discountPercent = Math.round(((displayMrp - rolePrice) / displayMrp) * 100);
                const isOutOfStock = p.stock === 0;
                const cartItem = (cart || []).find(c => c.id === p.id || c.product?.id === p.id);
                const cartQty = cartItem ? cartItem.quantity : 0;

                return (
                  <View
                    key={p.id}
                    style={{ width: '48.5%', height: 204 }}
                    className="bg-white rounded-xl border border-gray-100 overflow-hidden mb-2 p-1.5 shadow-2xs justify-between relative"
                  >
                    {/* Image & Title Touchable Area (Opens Product Details) */}
                    <TouchableOpacity
                      onPress={() => {
                        setSelectedProduct(p);
                        setCurrentScreen('product');
                      }}
                      activeOpacity={0.8}
                    >
                      {/* Image Box Container */}
                      <View className="relative w-full h-24 bg-white rounded-lg overflow-hidden mb-1 border border-gray-100">
                        <Image source={{ uri: p.image || 'https://images.unsplash.com/photo-1625093742435-6fa192b6fb10?w=400' }} className={`w-full h-full object-cover ${isOutOfStock ? 'opacity-40' : ''}`} />
                        {discountPercent > 0 && !isOutOfStock && (
                          <View style={{ position: 'absolute', top: 4, left: 4, backgroundColor: '#C2477A', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 }}>
                            <Text style={{ color: '#FFFFFF', fontSize: 9, fontWeight: '800' }}>{discountPercent}% OFF</Text>
                          </View>
                        )}
                      </View>

                      {/* Details */}
                      <Text className="text-[7.5px] font-bold text-[#8C7078] uppercase" numberOfLines={1}>
                        {p.brandName}
                      </Text>
                      <Text className="text-[10px] font-semibold text-[#3A2430] leading-tight" numberOfLines={2}>
                        {p.name}
                      </Text>
                    </TouchableOpacity>

                    {/* Bottom Row: Price Block on Left, ADD / Stepper Button on Right */}
                    <View className="pt-1 flex-row items-center justify-between">
                      {/* Price Block */}
                      <View className="flex-row items-baseline gap-1">
                        <Text className="text-xs font-black text-[#C2477A]">₹{rolePrice}</Text>
                        <Text className="text-[8.5px] text-[#8C7078] line-through font-semibold">
                          ₹{displayMrp}
                        </Text>
                      </View>

                      {/* ADD / Stepper Button */}
                      <View>
                        {isOutOfStock ? (
                          <View className="bg-gray-100 px-1.5 py-0.5 rounded border border-gray-200">
                            <Text className="text-gray-400 text-[8px] font-bold">N/A</Text>
                          </View>
                        ) : cartQty > 0 ? (
                          <View className="bg-[#C2477A] rounded-lg px-1.5 py-0.5 flex-row items-center gap-1 shadow-2xs">
                            <TouchableOpacity onPress={() => handleDecrement(p.id, cartQty)} className="w-4 h-4 items-center justify-center">
                              <Text className="text-white text-xs font-black">-</Text>
                            </TouchableOpacity>
                            <Text className="text-white text-[10px] font-extrabold px-0.5 min-w-[10px] text-center">{cartQty}</Text>
                            <TouchableOpacity onPress={() => handleIncrement(p, cartQty)} className="w-4 h-4 items-center justify-center">
                              <Text className="text-white text-xs font-black">+</Text>
                            </TouchableOpacity>
                          </View>
                        ) : (
                          <TouchableOpacity
                            onPress={() => handleIncrement(p, 0)}
                            className="px-2.5 py-0.5 rounded-lg border border-[#C2477A] bg-white shadow-2xs flex-row items-center"
                          >
                            <Text className="text-[#C2477A] text-[9.5px] font-extrabold">+ ADD</Text>
                          </TouchableOpacity>
                        )}
                      </View>
                    </View>
                  </View>
                );
              })
            )}
          </View>
        </ScrollView>
      </View>
    </View>
  );
};
