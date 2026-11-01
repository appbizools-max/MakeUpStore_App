import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../context/AppContext.jsx';
import { getProductTiersForRole } from '../utils/quantityTiersUtils';
import { isB2BRole } from '../utils/b2bVerificationService';
import { getSafeActiveVariants } from '../utils/productSearchEngine';
import {
  getAddOnRecommendations,
  getRelevantProductRecommendations,
  getSafeProductShades
} from '../utils/recommendationEngine';
import {
  ChevronLeft,
  ChevronRight,
  ShoppingBag,
  Heart,
  CheckCircle2,
  Palette,
  Check,
  Sparkles,
  Percent,
  ChevronDown,
  ChevronUp,
  ShieldCheck,
  Droplets,
  Info,
  Layers,
  BookOpen,
  FlaskConical,
  HelpCircle,
  Globe,
  Barcode,
  Plus
} from 'lucide-react';

export const ProductDetailScreen = () => {
  const {
    selectedProduct,
    setSelectedProduct,
    activeProducts,
    userRole,
    userProfile,
    isB2BVerified,
    getRolePrice,
    addToCart,
    updateCartQuantity,
    removeFromCart,
    cart,
    setCurrentScreen,
    isFavorite,
    toggleFavorite,
    selectedShade: contextSelectedShade,
    setSelectedShade: setContextSelectedShade,
    recommendationConfig
  } = useApp();

  const [addedToast, setAddedToast] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const isVariantChild = Boolean(selectedProduct?.isVariantChild);
  const baseProduct = (isVariantChild && selectedProduct.parentProduct) ? selectedProduct.parentProduct : (selectedProduct || {});

  // Active shades and variants from product (robust parsing supporting both baseProduct.variants and baseProduct.shades)
  const allSubProducts = useMemo(() => {
    return getSafeActiveVariants(baseProduct);
  }, [baseProduct]);

  // Distinguish between pure color shades and size/type variants
  const { shadeList, variantList } = useMemo(() => {
    const sList = [];
    const vList = [];

    allSubProducts.forEach(item => {
      const hasHex = Boolean(item.hexColor && String(item.hexColor).trim().length > 0);
      const attrs = item.attributes || {};
      const hasShadeAttr = Boolean(
        attrs['Shade / Colour'] ||
        attrs['Shade'] ||
        attrs['Color'] ||
        attrs['Shade Code']
      );
      const hasSizeAttr = Boolean(
        attrs['Size'] ||
        attrs['Volume'] ||
        attrs['Net Quantity'] ||
        attrs['Pack']
      );

      if (hasSizeAttr && !hasHex && !hasShadeAttr) {
        vList.push(item);
      } else if (hasHex || hasShadeAttr) {
        sList.push(item);
      } else {
        const cat = String(baseProduct?.category || '').toLowerCase();
        if (cat.includes('lip') || cat.includes('makeup') || cat.includes('polish') || cat.includes('eye')) {
          sList.push(item);
        } else {
          vList.push(item);
        }
      }
    });

    return { shadeList: sList, variantList: vList };
  }, [allSubProducts, baseProduct?.category]);

  const [selectedShade, setSelectedShade] = useState(() => {
    if (isVariantChild) {
      const match = allSubProducts.find(s =>
        (selectedProduct.realVariantId && (s.id === selectedProduct.realVariantId || s.sku === selectedProduct.realVariantId)) ||
        (selectedProduct.variantName && (s.name === selectedProduct.variantName || s.title === selectedProduct.variantName)) ||
        (selectedProduct.barcode && s.barcode === selectedProduct.barcode)
      );
      if (match) return match;
      if (selectedProduct.variantData) return selectedProduct.variantData;
    }
    if (contextSelectedShade && allSubProducts.some(s => s.id === contextSelectedShade.id || s.name === contextSelectedShade.name)) {
      return contextSelectedShade;
    }
    return allSubProducts[0] || null;
  });

  useEffect(() => {
    if (isVariantChild) {
      const match = allSubProducts.find(s =>
        (selectedProduct.realVariantId && (s.id === selectedProduct.realVariantId || s.sku === selectedProduct.realVariantId)) ||
        (selectedProduct.variantName && (s.name === selectedProduct.variantName || s.title === selectedProduct.variantName)) ||
        (selectedProduct.barcode && s.barcode === selectedProduct.barcode)
      );
      if (match) {
        setSelectedShade(match);
        return;
      }
      if (selectedProduct.variantData) {
        setSelectedShade(selectedProduct.variantData);
        return;
      }
    }
    if (contextSelectedShade && allSubProducts.some(s => s.id === contextSelectedShade.id || s.name === contextSelectedShade.name)) {
      setSelectedShade(contextSelectedShade);
    } else if (allSubProducts.length > 0) {
      if (!selectedShade || !allSubProducts.some(s => s.id === selectedShade.id || s.name === selectedShade.name)) {
        setSelectedShade(allSubProducts[0]);
      }
    } else {
      setSelectedShade(null);
    }
  }, [selectedProduct?.id, contextSelectedShade, allSubProducts]);

  const handleSelectSubProduct = (item) => {
    setSelectedShade(item);
    if (setContextSelectedShade) setContextSelectedShade(item);
  };

  // Reset slider index when product changes
  useEffect(() => {
    setCurrentImageIndex(0);
  }, [baseProduct?.id]);

  // Active images: prioritize selected shade image as hero image
  const productImages = useMemo(() => {
    const list = [];
    const shadeImg = selectedShade?.imageUrl || selectedShade?.image;
    if (shadeImg) {
      list.push(shadeImg);
    }
    if (baseProduct?.images && baseProduct.images.length > 0) {
      baseProduct.images.forEach(img => {
        if (img && !list.includes(img)) list.push(img);
      });
    } else {
      const pImg = baseProduct?.imageUrl || baseProduct?.image;
      if (pImg && !list.includes(pImg)) list.push(pImg);
    }
    return list;
  }, [baseProduct, selectedShade]);

  // Automatic image slider timer (cycles every 3 seconds)
  useEffect(() => {
    if (!productImages || productImages.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % productImages.length);
    }, 3000);

    return () => clearInterval(interval);
  }, [productImages.length]);

  const cartItemId = selectedShade ? `${baseProduct?.id}_${selectedShade.id || selectedShade.sku || selectedShade.name}` : baseProduct?.id;
  const cartItem = (cart || []).find(c => (c.id === cartItemId || c.product?.id === cartItemId));
  const cartQty = cartItem ? cartItem.quantity : 0;

  const currentRolePrice = getRolePrice(baseProduct, userRole, selectedShade, Math.max(1, cartQty));
  const shadeMrp = Number(selectedShade?.mrp || selectedShade?.originalMrp || selectedShade?.priceOverride || 0);
  const displayMrp = shadeMrp > currentRolePrice
    ? shadeMrp
    : (baseProduct?.mrp && baseProduct.mrp > currentRolePrice ? Number(baseProduct.mrp) : Math.round(currentRolePrice * 1.25));
  const hasDiscount = displayMrp > currentRolePrice;
  const savings = displayMrp - currentRolePrice;
  const discountPercent = Math.round((savings / displayMrp) * 100);

  const [quickShadeModalItem, setQuickShadeModalItem] = useState(null);
  const [selectedQuickShade, setSelectedQuickShade] = useState(null);
  const [locallyAddedIds, setLocallyAddedIds] = useState([]);
  const [toastText, setToastText] = useState('Added to your Cart!');

  useEffect(() => {
    setLocallyAddedIds([]);
  }, [selectedProduct?.id]);

  const addOnProducts = useMemo(() => {
    if (recommendationConfig?.enabled === false) return [];
    const recs = getAddOnRecommendations(selectedProduct, activeProducts, cart, {
      maxCount: (recommendationConfig?.maxAddOns || 8) + locallyAddedIds.length,
      frequentlyBoughtTogether: recommendationConfig?.frequentlyBoughtTogether !== false,
      popularProductsFallback: recommendationConfig?.popularProductsFallback !== false
    });
    return recs.filter(p => !locallyAddedIds.includes(p.id)).slice(0, recommendationConfig?.maxAddOns || 8);
  }, [selectedProduct, activeProducts, cart, recommendationConfig, locallyAddedIds]);

  const relevantProducts = useMemo(() => {
    if (recommendationConfig?.enabled === false) return [];
    const addOnIds = addOnProducts.map(p => p.id);
    return getRelevantProductRecommendations(selectedProduct, activeProducts, cart, {
      maxCount: recommendationConfig?.maxRelevant || 8,
      excludeIds: [...addOnIds, ...locallyAddedIds]
    });
  }, [selectedProduct, activeProducts, cart, recommendationConfig, addOnProducts, locallyAddedIds]);

  const handleAddOnPress = (product) => {
    const subItems = getSafeProductShades(product);
    if (subItems.length > 1) {
      setQuickShadeModalItem(product);
      setSelectedQuickShade(subItems[0]);
    } else {
      const chosenShade = subItems.length === 1 ? subItems[0] : null;
      addToCart(product, 1, chosenShade);
      setLocallyAddedIds(prev => [...prev, product.id]);
      setToastText(`Added ${product.name} to cart! ✨`);
      setAddedToast(true);
      setTimeout(() => setAddedToast(false), 2500);
    }
  };

  const handleConfirmQuickShadeAdd = () => {
    if (!quickShadeModalItem) return;
    addToCart(quickShadeModalItem, 1, selectedQuickShade);
    setLocallyAddedIds(prev => [...prev, quickShadeModalItem.id]);
    setToastText(`Added ${quickShadeModalItem.name}${selectedQuickShade ? ` (${selectedQuickShade.name})` : ''} to cart! ✨`);
    setAddedToast(true);
    setTimeout(() => setAddedToast(false), 2500);
    setQuickShadeModalItem(null);
    setSelectedQuickShade(null);
  };

  const handleAddToCart = () => {
    addToCart(baseProduct, 1, selectedShade);
    setToastText(`Added ${baseProduct.name}${selectedShade ? ` (${selectedShade.title || selectedShade.name})` : ''} to cart! ✨`);
    setAddedToast(true);
    setTimeout(() => setAddedToast(false), 2500);
  };

  const handleIncrement = () => {
    if (cartQty === 0) {
      addToCart(baseProduct, 1, selectedShade);
    } else {
      updateCartQuantity(cartItemId, cartQty + 1);
    }
  };

  const handleDecrement = () => {
    if (cartQty > 1) {
      updateCartQuantity(cartItemId, cartQty - 1);
    } else if (cartQty === 1) {
      removeFromCart(cartItemId);
    }
  };

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % productImages.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + productImages.length) % productImages.length);
  };

  return (
    <div className="min-h-screen bg-[#F4F5F8] text-[#3A2430] pb-36 animate-fade-in relative">
      {/* 1. Transparent Floating Top Navigation Bar */}
      <div className="sticky top-0 z-30 px-3 py-3 flex items-center justify-between bg-transparent pointer-events-auto">
        <button
          onClick={() => setCurrentScreen('category')}
          className="w-10 h-10 rounded-full bg-white/80 backdrop-blur-md border border-white/50 flex items-center justify-center text-[#3A2430] shadow-sm hover:bg-white transition-colors cursor-pointer"
        >
          <ChevronLeft size={22} />
        </button>
        <button
          onClick={() => toggleFavorite(selectedProduct)}
          className="w-10 h-10 rounded-full bg-white/90 backdrop-blur-md border border-[#FCE4EC] flex items-center justify-center shadow-sm hover:bg-white transition-colors cursor-pointer"
          title={isFavorite(selectedProduct?.id) ? "Remove from Wishlist" : "Add to Wishlist"}
        >
          <Heart size={20} className={isFavorite(selectedProduct?.id) ? "fill-[#C2477A] text-[#C2477A]" : "text-[#C2477A]"} />
        </button>
      </div>
      
      {/* Added Toast Notification */}
      {addedToast && (
        <div className="fixed top-14 left-4 right-4 z-40 p-3 bg-emerald-600 text-white rounded-xl text-xs font-extrabold flex items-center justify-between shadow-xl animate-fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={18} />
            <span>{toastText}</span>
          </div>
          <button
            onClick={() => setCurrentScreen('cart')}
            className="bg-white text-emerald-700 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider shadow-xs cursor-pointer"
          >
            View Cart
          </button>
        </div>
      )}

      {/* 2. Interactive Hero Image Slider & Dots */}
      <div className="bg-white px-4 pt-2 pb-5 flex flex-col items-center relative border-b border-gray-100 -mt-16">
        <div className="w-full aspect-square max-h-76 bg-white flex items-center justify-center relative pt-12 group">
          <img
            src={productImages[currentImageIndex]}
            alt={selectedProduct.name}
            className="max-h-full max-w-full object-contain transition-all duration-300"
          />

          {/* Left / Right Chevron Controls for Image Slider */}
          {productImages.length > 1 && (
            <>
              <button
                onClick={prevImage}
                className="absolute left-1 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/90 shadow-md border border-gray-100 flex items-center justify-center text-[#3A2430] hover:bg-white transition-all cursor-pointer"
              >
                <ChevronLeft size={18} />
              </button>
              <button
                onClick={nextImage}
                className="absolute right-1 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/90 shadow-md border border-gray-100 flex items-center justify-center text-[#3A2430] hover:bg-white transition-all cursor-pointer"
              >
                <ChevronRight size={18} />
              </button>
            </>
          )}
        </div>

        {/* Interactive Carousel Pagination Dots */}
        <div className="flex items-center gap-2 mt-3">
          {productImages.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentImageIndex(idx)}
              className={`transition-all rounded-full cursor-pointer ${
                idx === currentImageIndex
                  ? 'w-3 h-3 bg-[#C2477A] scale-110'
                  : 'w-2 h-2 bg-gray-300 hover:bg-gray-400'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Content Container */}
      <div className="p-3 space-y-3 max-w-md mx-auto">
        {/* 3. Main Product Info Card */}
        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-2xs space-y-2">
          {/* Brand Tag */}
          <span className="inline-block text-[9px] font-black uppercase tracking-widest bg-[#FCE4EC] text-[#C2477A] px-2.5 py-0.5 rounded-full">
            {baseProduct.brandName || baseProduct.brand || 'Premium Brand'}
          </span>

          {/* Title & Active Variant Badge */}
          <h1 className="text-base font-black text-[#3A2430] leading-snug pt-1">
            {baseProduct.name}
          </h1>

          {/* Active Variant / Shade Pill */}
          {selectedShade && (
            <div className="pt-0.5">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FFF0F5] border border-[#FCE4EC] text-xs font-black text-[#C2477A] shadow-2xs">
                {selectedShade.hexColor && (
                  <span
                    className="w-3 h-3 rounded-full border border-gray-300 shadow-2xs shrink-0"
                    style={{ backgroundColor: selectedShade.hexColor }}
                  />
                )}
                <span>Shade: {selectedShade.title || selectedShade.name}</span>
                {selectedShade.barcode && (
                  <span className="font-mono text-[10px] text-gray-400 font-normal pl-1">
                    [{selectedShade.barcode}]
                  </span>
                )}
              </span>
            </div>
          )}

          <span className="inline-block text-xs font-bold text-[#8C7078]">
            {baseProduct.category || 'Beauty'}
          </span>

          {/* Description */}
          <p className="text-xs text-[#8C7078] leading-relaxed pt-1 border-t border-gray-50">
            {baseProduct.description || 'Professional grade cosmetic formulation designed for long-lasting, smudge-proof perfection. Dermatologically tested for sensitive skin.'}
          </p>

          {/* Price Row */}
          <div className="pt-2 flex items-baseline gap-2">
            <span className="text-xs font-black text-[#8C7078] uppercase">MRP</span>
            <span className="text-xl font-black text-[#3A2430]">₹{currentRolePrice}</span>
            {hasDiscount && (
              <span className="text-xs text-[#8C7078] line-through font-semibold">
                ₹{displayMrp}
              </span>
            )}
            {discountPercent > 0 && (
              <span className="bg-[#C2477A] text-white text-[9.5px] font-black px-2 py-0.5 rounded uppercase">
                {discountPercent}% OFF
              </span>
            )}
          </div>

          {/* Bulk Quantity Discounts — For all roles including General User, Salon Owner, Makeup Artist, and Beautician */}
          {(() => {
            const effectiveRole = (isB2BRole(userRole) && !isB2BVerified) ? 'general' : userRole;
            const roleTiers = getProductTiersForRole(selectedProduct, effectiveRole, selectedShade);
            if (!roleTiers || roleTiers.length === 0) return null;

            const roleName = effectiveRole === 'salon'
              ? 'Salon Owner'
              : effectiveRole === 'artist'
              ? 'Makeup Artist'
              : effectiveRole === 'beautician'
              ? 'Beautician'
              : 'General User';

            return (
              <div className="mt-3 pt-3 border-t border-pink-100/80">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-black uppercase tracking-wider text-[#C2477A] flex items-center gap-1">
                    <Sparkles size={12} /> Quantity Discount Tiers ({roleName})
                  </span>
                  <span className="text-[9.5px] text-gray-400 font-medium">Buy more, save more</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                  {roleTiers.map((tier, tIdx, arr) => {
                    const isHighest = tIdx === arr.length - 1;
                    const label = isHighest ? `${tier.minQty}+ units` : `${tier.minQty} units`;
                    const tierUnitPrice = getRolePrice(selectedProduct, effectiveRole, selectedShade, Number(tier.minQty));
                    const isActive = cartQty >= Number(tier.minQty) && (isHighest || cartQty < Number(arr[tIdx + 1]?.minQty));
                    return (
                      <div
                        key={tier.id || tIdx}
                        className={`p-2 rounded-xl border text-center transition-all ${
                          isActive
                            ? 'bg-[#FCE4EC] border-[#C2477A] text-[#C2477A] shadow-xs ring-1 ring-[#C2477A]'
                            : 'bg-gray-50/80 border-gray-200 text-gray-700'
                        }`}
                      >
                        <div className="text-[10px] font-extrabold flex items-center justify-center gap-1">
                          <span>{label}</span>
                          {isActive && <span className="w-1.5 h-1.5 rounded-full bg-[#C2477A]" />}
                        </div>
                        <div className="text-xs font-black text-gray-900 mt-0.5">₹{tierUnitPrice}</div>
                        {Number(tier.additionalDiscount) > 0 ? (
                          <div className="text-[9px] font-bold text-emerald-600">+{tier.additionalDiscount}% OFF</div>
                        ) : (
                          <div className="text-[9px] font-semibold text-gray-400">Base Tier</div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })()}
        </div>

        {/* ── AVAILABLE SHADES (HORIZONTAL PRODUCT CARDS) ── */}
        {shadeList.length > 0 && (
          <div className="bg-white p-4 rounded-2xl border border-[#FCE4EC] shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-xl bg-[#FFF0F5] text-[#C2477A] flex items-center justify-center border border-[#FCE4EC]">
                  <Palette size={15} />
                </div>
                <div>
                  <h3 className="text-xs font-black text-[#3A2430] uppercase tracking-wide">Available Shades</h3>
                  <span className="text-[10px] text-[#8C7078] block">
                    {shadeList.length} {shadeList.length === 1 ? 'curated shade' : 'curated shades'}
                  </span>
                </div>
              </div>
              {selectedShade && shadeList.some(s => s.id === selectedShade.id || s.name === selectedShade.name) && (
                <div className="flex items-center gap-1.5 bg-[#FFF0F5] px-2.5 py-1 rounded-full border border-[#FCE4EC]">
                  <span
                    className="w-3.5 h-3.5 rounded-full border border-white shadow-xs"
                    style={{ background: selectedShade.hexColor || '#C2477A' }}
                  />
                  <span className="text-[11px] font-black text-[#C2477A]">{selectedShade.name}</span>
                </div>
              )}
            </div>

            {/* Horizontal Product Cards Scroll */}
            <div className="flex gap-2.5 overflow-x-auto pb-2 scrollbar-thin">
              {shadeList.map((shade, idx) => {
                const isSelected = selectedShade && (selectedShade.id === shade.id || selectedShade.name === shade.name || selectedShade.title === shade.title);
                const sPrice = getRolePrice(baseProduct, userRole, shade, 1);
                const sMrp = Number(shade.mrp || shade.originalMrp || shade.priceOverride || (baseProduct.mrp && baseProduct.mrp > sPrice ? baseProduct.mrp : Math.round(sPrice * 1.25)));

                return (
                  <button
                    key={shade.id || idx}
                    type="button"
                    onClick={() => handleSelectSubProduct(shade)}
                    className={`relative w-28 shrink-0 flex flex-col p-2 rounded-2xl border text-left transition-all cursor-pointer ${
                      isSelected
                        ? 'border-[#C2477A] bg-[#FFF5F8] ring-2 ring-[#C2477A]/20 shadow-xs'
                        : 'border-[#FCE4EC] bg-white hover:border-[#F5A8C0]'
                    }`}
                  >
                    {/* Visual Thumbnail */}
                    <div className="relative w-full h-24 rounded-xl overflow-hidden mb-1.5 bg-[#FFF5F8] border border-[#FCE4EC]/60 flex items-center justify-center">
                      <img
                        src={shade.imageUrl || shade.image || baseProduct.image || ''}
                        alt={shade.title || shade.name}
                        onError={(e) => { e.target.style.display = 'none'; }}
                        className="w-full h-full object-cover"
                      />
                      {shade.hexColor && (
                        <span
                          className="absolute bottom-1.5 right-1.5 w-4 h-4 rounded-full border-2 border-white shadow-xs"
                          style={{ background: shade.hexColor }}
                        />
                      )}
                      {isSelected && (
                        <span className="absolute top-1.5 left-1.5 w-4 h-4 rounded-full bg-[#C2477A] text-white flex items-center justify-center shadow-xs">
                          <Check size={10} strokeWidth={3.5} />
                        </span>
                      )}
                    </div>

                    <span className={`text-[11px] font-bold block leading-tight line-clamp-2 ${isSelected ? 'text-[#C2477A]' : 'text-[#3A2430]'}`}>
                      {shade.name}
                    </span>

                    <div className="flex items-baseline gap-1 mt-1">
                      <span className="text-xs font-black text-[#C2477A]">₹{sPrice}</span>
                      {sMrp > sPrice && (
                        <span className="text-[9px] text-[#8C7078] line-through">₹{sMrp}</span>
                      )}
                    </div>

                    <div className={`mt-1.5 py-0.5 rounded-full text-center text-[9px] font-bold ${
                      isSelected ? 'bg-[#C2477A] text-white' : 'bg-[#FFF0F5] text-[#C2477A] border border-[#FCE4EC]'
                    }`}>
                      {isSelected ? 'Selected' : 'Select'}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ── AVAILABLE VARIANTS / SIZES (HORIZONTAL PRODUCT CARDS) ── */}
        {variantList.length > 0 && (
          <div className="bg-white p-4 rounded-2xl border border-[#FCE4EC] shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-xl bg-[#FFF0F5] text-[#C2477A] flex items-center justify-center border border-[#FCE4EC]">
                  <Layers size={15} />
                </div>
                <div>
                  <h3 className="text-xs font-black text-[#3A2430] uppercase tracking-wide">Available Variants</h3>
                  <span className="text-[10px] text-[#8C7078] block">
                    {variantList.length} {variantList.length === 1 ? 'option' : 'options'}
                  </span>
                </div>
              </div>
              {selectedShade && variantList.some(v => v.id === selectedShade.id || v.name === selectedShade.name || v.title === selectedShade.title) && (
                <div className="bg-[#FFF0F5] px-2.5 py-1 rounded-full border border-[#FCE4EC]">
                  <span className="text-[11px] font-black text-[#C2477A]">{selectedShade.title || selectedShade.name}</span>
                </div>
              )}
            </div>

            {/* Horizontal Product Cards Scroll */}
            <div className="flex gap-2.5 overflow-x-auto pb-2 scrollbar-thin">
              {variantList.map((variant, idx) => {
                const isSelected = selectedShade && (selectedShade.id === variant.id || selectedShade.name === variant.name || selectedShade.title === variant.title);
                const vPrice = getRolePrice(baseProduct, userRole, variant, 1);
                const vMrp = Number(variant.mrp || variant.originalMrp || variant.priceOverride || (baseProduct.mrp && baseProduct.mrp > vPrice ? baseProduct.mrp : Math.round(vPrice * 1.25)));

                return (
                  <button
                    key={variant.id || idx}
                    type="button"
                    onClick={() => handleSelectSubProduct(variant)}
                    className={`relative w-28 shrink-0 flex flex-col p-2 rounded-2xl border text-left transition-all cursor-pointer ${
                      isSelected
                        ? 'border-[#C2477A] bg-[#FFF5F8] ring-2 ring-[#C2477A]/20 shadow-xs'
                        : 'border-[#FCE4EC] bg-white hover:border-[#F5A8C0]'
                    }`}
                  >
                    <div className="relative w-full h-24 rounded-xl overflow-hidden mb-1.5 bg-[#FFF5F8] border border-[#FCE4EC]/60 flex items-center justify-center">
                      <img
                        src={variant.imageUrl || variant.image || baseProduct.image || ''}
                        alt={variant.title || variant.name}
                        onError={(e) => { e.target.style.display = 'none'; }}
                        className="w-full h-full object-cover"
                      />
                      {isSelected && (
                        <span className="absolute top-1.5 left-1.5 w-4 h-4 rounded-full bg-[#C2477A] text-white flex items-center justify-center shadow-xs">
                          <Check size={10} strokeWidth={3.5} />
                        </span>
                      )}
                    </div>

                    <span className={`text-[11px] font-bold block leading-tight line-clamp-2 ${isSelected ? 'text-[#C2477A]' : 'text-[#3A2430]'}`}>
                      {variant.name}
                    </span>

                    <div className="flex items-baseline gap-1 mt-1">
                      <span className="text-xs font-black text-[#C2477A]">₹{vPrice}</span>
                      {vMrp > vPrice && (
                        <span className="text-[9px] text-[#8C7078] line-through">₹{vMrp}</span>
                      )}
                    </div>

                    <div className={`mt-1.5 py-0.5 rounded-full text-center text-[9px] font-bold ${
                      isSelected ? 'bg-[#C2477A] text-white' : 'bg-[#FFF0F5] text-[#C2477A] border border-[#FCE4EC]'
                    }`}>
                      {isSelected ? 'Selected' : 'Select'}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* =================================================================
            PURPLLE-STYLE PRODUCT INFORMATION DEPTH
            Key Points, Benefits, Specifications, Ingredients, How To Use
            ================================================================= */}

        {/* 1. Key Points & Benefits */}
        {((selectedProduct?.keyPoints && selectedProduct.keyPoints.length > 0) ||
          (selectedProduct?.benefits && selectedProduct.benefits.length > 0) ||
          (selectedProduct?.highlights && selectedProduct.highlights.length > 0)) && (
          <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-2xs space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-xl bg-pink-100 text-[#C2477A] flex items-center justify-center">
                <Sparkles size={15} />
              </div>
              <div>
                <h3 className="text-xs font-black text-[#3A2430]">Product Highlights & Benefits</h3>
                <span className="text-[10px] text-[#8C7078] block">Key selling points and performance</span>
              </div>
            </div>

            {/* Concise Key Points */}
            {selectedProduct?.keyPoints && selectedProduct.keyPoints.length > 0 && (
              <div className="grid grid-cols-2 gap-2 pt-1">
                {selectedProduct.keyPoints.map((pt, idx) => (
                  <div key={idx} className="flex items-center gap-2 bg-[#FFF8FA] p-2 rounded-xl border border-pink-100/70">
                    <CheckCircle2 size={13} className="text-[#C2477A] shrink-0" />
                    <span className="text-[11px] font-bold text-gray-800 leading-tight">{pt}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Reusable Benefits Pills */}
            {selectedProduct?.benefits && selectedProduct.benefits.length > 0 && (
              <div className="pt-2 border-t border-gray-100">
                <span className="text-[10px] font-extrabold uppercase text-[#8C7078] tracking-wider block mb-2">
                  Benefits
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {selectedProduct.benefits.map((b, idx) => (
                    <span key={idx} className="px-2.5 py-1 rounded-full bg-[#FCE4EC] text-[#C2477A] text-[10.5px] font-bold border border-pink-200/60">
                      {b}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Descriptive Highlights Bullets */}
            {selectedProduct?.highlights && selectedProduct.highlights.length > 0 && (
              <div className="pt-2 border-t border-gray-100 space-y-1.5">
                <span className="text-[10px] font-extrabold uppercase text-[#8C7078] tracking-wider block mb-1">
                  Highlights
                </span>
                {selectedProduct.highlights.map((h, idx) => (
                  <div key={idx} className="flex items-start gap-2 text-xs text-gray-700 leading-relaxed">
                    <span className="text-[#C2477A] font-black text-sm leading-none">•</span>
                    <span>{h}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 2. Structured Product Specifications Table */}
        {(() => {
          const specs = selectedProduct?.specifications || {};
          const specEntries = [
            { label: 'Product Type', val: selectedProduct?.productType || specs.productType },
            { label: 'Finish', val: selectedShade?.attributes?.finish || specs.finish },
            { label: 'Coverage', val: selectedShade?.attributes?.coverage || specs.coverage },
            { label: 'Formulation', val: selectedShade?.attributes?.formulation || specs.formulation },
            { label: 'Colour Family', val: selectedShade?.attributes?.colourFamily || specs.colourFamily },
            { label: 'Net Quantity', val: selectedShade?.attributes?.size || selectedShade?.attributes?.volume || specs.netQuantity || specs.volume || specs.size },
            { label: 'Skin Type', val: selectedShade?.attributes?.skinType || specs.skinType },
            { label: 'Hair Type', val: selectedShade?.attributes?.hairType || specs.hairType },
            { label: 'Country of Origin', val: specs.countryOfOrigin || selectedProduct?.additionalInfo?.countryOfOrigin || 'India' }
          ].filter(item => Boolean(item.val));

          if (specEntries.length === 0) return null;

          return (
            <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-2xs space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center">
                  <Layers size={15} />
                </div>
                <div>
                  <h3 className="text-xs font-black text-[#3A2430]">Product Specifications</h3>
                  <span className="text-[10px] text-[#8C7078] block">Detailed attribute breakdown</span>
                </div>
              </div>

              <div className="divide-y divide-gray-100 border border-gray-100 rounded-xl overflow-hidden text-xs">
                {specEntries.map((spec, sIdx) => (
                  <div key={sIdx} className="flex justify-between py-2 px-3 bg-white even:bg-gray-50/50">
                    <span className="text-gray-500 font-medium">{spec.label}</span>
                    <span className="font-bold text-gray-900 text-right">{spec.val}</span>
                  </div>
                ))}
                {selectedShade?.code && (
                  <div className="flex justify-between py-2 px-3 bg-purple-50/40">
                    <span className="text-purple-700 font-semibold">Shade Code</span>
                    <span className="font-bold text-purple-900 text-right">{selectedShade.code}</span>
                  </div>
                )}
                {selectedShade?.sku && (
                  <div className="flex justify-between py-2 px-3 bg-purple-50/40">
                    <span className="text-purple-700 font-semibold">Variant SKU</span>
                    <span className="font-mono font-bold text-purple-900 text-right">{selectedShade.sku}</span>
                  </div>
                )}
              </div>
            </div>
          );
        })()}

        {/* 3. Ingredients & Hero Actives */}
        {(() => {
          const ingData = selectedProduct?.ingredients;
          const keyActives = Array.isArray(ingData?.keyIngredients) ? ingData.keyIngredients : [];
          const fullList = typeof ingData === 'string' ? ingData : (ingData?.fullList || '');

          if (keyActives.length === 0 && !fullList) return null;

          return (
            <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-2xs space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <FlaskConical size={15} />
                </div>
                <div>
                  <h3 className="text-xs font-black text-[#3A2430]">Ingredients</h3>
                  <span className="text-[10px] text-[#8C7078] block">Active ingredients and formulation</span>
                </div>
              </div>

              {/* Key Hero Ingredients */}
              {keyActives.length > 0 && (
                <div>
                  <span className="text-[10px] font-extrabold uppercase text-[#8C7078] tracking-wider block mb-2">
                    Hero Actives
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {keyActives.map((act, idx) => (
                      <span key={idx} className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 text-[10.5px] font-bold border border-emerald-200/60">
                        {act}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Full INCI Ingredient List */}
              {fullList && (
                <div className="pt-2 border-t border-gray-100">
                  <span className="text-[10px] font-extrabold uppercase text-[#8C7078] tracking-wider block mb-1">
                    Complete List
                  </span>
                  <p className="text-[11px] text-gray-600 leading-relaxed font-mono bg-gray-50/80 p-2.5 rounded-xl border border-gray-100">
                    {fullList}
                  </p>
                </div>
              )}
            </div>
          );
        })()}

        {/* 4. How To Apply / How To Use */}
        {selectedProduct?.howToUse && (
          <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-2xs space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center">
                <BookOpen size={15} />
              </div>
              <div>
                <h3 className="text-xs font-black text-[#3A2430]">
                  {/lip|makeup|face|nail|eye/i.test(selectedProduct?.category || '') ? 'How To Apply' : 'How To Use'}
                </h3>
                <span className="text-[10px] text-[#8C7078] block">Application instructions for best results</span>
              </div>
            </div>
            <p className="text-xs text-gray-700 leading-relaxed bg-sky-50/50 p-3 rounded-xl border border-sky-100/70 font-medium">
              {selectedProduct.howToUse}
            </p>
          </div>
        )}

        {/* 5. Additional / Regulatory Information */}
        {(() => {
          const addInfo = selectedProduct?.additionalInfo || {};
          const addEntries = [
            { label: 'Country of Origin', val: addInfo.countryOfOrigin },
            { label: 'Shelf Life', val: addInfo.shelfLife },
            { label: 'Manufacturer', val: addInfo.manufacturer },
            { label: 'Marketed By', val: addInfo.marketedBy },
            { label: 'Commodity Name', val: addInfo.commodityName },
            { label: 'Package Contents', val: addInfo.packageContents }
          ].filter(item => Boolean(item.val));

          if (addEntries.length === 0) return null;

          return (
            <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-2xs space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-xl bg-gray-100 text-gray-700 flex items-center justify-center">
                  <Info size={15} />
                </div>
                <div>
                  <h3 className="text-xs font-black text-[#3A2430]">Additional Information</h3>
                  <span className="text-[10px] text-[#8C7078] block">Manufacturing and regulatory compliance</span>
                </div>
              </div>
              <div className="divide-y divide-gray-100 border border-gray-100 rounded-xl overflow-hidden text-[11px]">
                {addEntries.map((item, idx) => (
                  <div key={idx} className="flex justify-between py-2 px-3 bg-white">
                    <span className="text-gray-500 font-medium">{item.label}</span>
                    <span className="font-bold text-gray-800 text-right">{item.val}</span>
                  </div>
                ))}
              </div>
            </div>
          );
        })()}

        {/* ── 5. COMPLETE YOUR LOOK ✨ (AUTOMATIC ADD-ONS) ── */}
        {addOnProducts.length > 0 && (
          <div className="bg-white p-4 rounded-2xl border border-[#FCE4EC] shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-xl bg-[#FFF0F5] text-[#C2477A] flex items-center justify-center border border-[#FCE4EC]">
                  <Sparkles size={15} />
                </div>
                <div>
                  <h3 className="text-xs font-black text-[#3A2430] uppercase tracking-wide">
                    Complete Your Look ✨
                  </h3>
                  <span className="text-[10px] text-[#8C7078] block">
                    Complementary essentials for your routine
                  </span>
                </div>
              </div>
              <span className="bg-[#FFF0F5] text-[#C2477A] text-[10px] font-bold px-2 py-0.5 rounded-full border border-[#FCE4EC]">
                {addOnProducts.length}
              </span>
            </div>

            <div className="flex gap-3 overflow-x-auto no-scrollbar pb-1">
              {addOnProducts.map((p) => {
                const subItems = getSafeProductShades(p);
                const pPrice = getRolePrice(p, userRole, subItems[0] || null, 1);
                const pMrp = p.mrp > pPrice ? Number(p.mrp) : Math.round(pPrice * 1.25);

                return (
                  <div
                    key={p.id}
                    className="w-36 flex-shrink-0 bg-white border border-[#FCE4EC] rounded-2xl p-2.5 shadow-2xs flex flex-col justify-between"
                  >
                    <div>
                      <div
                        onClick={() => {
                          setSelectedProduct(p);
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                        className="relative w-full h-24 rounded-xl overflow-hidden mb-1.5 bg-[#FFF5F8] border border-[#FCE4EC]/60 cursor-pointer"
                      >
                        <img
                          src={subItems[0]?.image || p.image}
                          alt={p.name}
                          loading="lazy"
                          decoding="async"
                          className="w-full h-full object-cover"
                        />
                        {subItems.length > 1 && (
                          <div className="absolute bottom-1 right-1 bg-black/60 text-white text-[8.5px] font-bold px-1.5 py-0.5 rounded flex items-center gap-1">
                            <Palette size={10} />
                            <span>{subItems.length}</span>
                          </div>
                        )}
                      </div>

                      <span className="text-[8.5px] font-extrabold text-[#C2477A] uppercase truncate block">
                        {p.brandName || p.category || 'Salbeau'}
                      </span>
                      <h5 className="text-[11px] font-bold text-[#3A2430] line-clamp-2 leading-tight mb-1">
                        {p.name}
                      </h5>

                      {subItems.length > 1 ? (
                        <span className="text-[9px] font-semibold text-violet-700 bg-violet-50 px-1.5 py-0.5 rounded border border-violet-100 inline-block mb-1.5">
                          {subItems.length} shades
                        </span>
                      ) : subItems.length === 1 ? (
                        <span className="text-[9px] text-[#8C7078] truncate block mb-1.5">
                          Shade: {subItems[0].name}
                        </span>
                      ) : (
                        <span className="text-[9px] text-[#8C7078] truncate block mb-1.5">
                          {p.category || 'Standard'}
                        </span>
                      )}

                      <div className="flex items-baseline gap-1 mb-2">
                        <span className="text-xs font-black text-[#C2477A]">₹{pPrice}</span>
                        {pMrp > pPrice && (
                          <span className="text-[9px] text-[#8C7078] line-through">₹{pMrp}</span>
                        )}
                      </div>
                    </div>

                    <button
                      onClick={() => handleAddOnPress(p)}
                      className="w-full py-1.5 rounded-xl bg-[#C2477A] hover:bg-[#a83765] text-white text-[10px] font-black flex items-center justify-center gap-1 shadow-2xs transition-all cursor-pointer"
                    >
                      <Plus size={12} />
                      <span>{subItems.length > 1 ? '+ Select' : '+ Add'}</span>
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── 6. YOU MAY ALSO LIKE 💜 (RELEVANT PRODUCTS) ── */}
        {relevantProducts.length > 0 && (
          <div className="bg-white p-4 rounded-2xl border border-[#FCE4EC] shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-xl bg-[#F3E5F5] text-[#8E24AA] flex items-center justify-center border border-[#E1BEE7]">
                  <Heart size={15} />
                </div>
                <div>
                  <h3 className="text-xs font-black text-[#3A2430] uppercase tracking-wide">
                    You May Also Like 💜
                  </h3>
                  <span className="text-[10px] text-[#8C7078] block">
                    Similar formulations and alternatives
                  </span>
                </div>
              </div>
              <span className="bg-[#F3E5F5] text-[#8E24AA] text-[10px] font-bold px-2 py-0.5 rounded-full border border-[#E1BEE7]">
                {relevantProducts.length}
              </span>
            </div>

            <div className="flex gap-3 overflow-x-auto no-scrollbar pb-1">
              {relevantProducts.map((p) => {
                const subItems = getSafeProductShades(p);
                const pPrice = getRolePrice(p, userRole, subItems[0] || null, 1);
                const pMrp = p.mrp > pPrice ? Number(p.mrp) : Math.round(pPrice * 1.25);

                return (
                  <div
                    key={p.id}
                    onClick={() => {
                      setSelectedProduct(p);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className="w-36 flex-shrink-0 bg-white border border-[#FCE4EC] rounded-2xl p-2.5 shadow-2xs cursor-pointer hover:border-[#C2477A]/40 transition-all flex flex-col justify-between"
                  >
                    <div>
                      <div className="relative w-full h-24 rounded-xl overflow-hidden mb-1.5 bg-[#FFF5F8] border border-[#FCE4EC]/60">
                        <img
                          src={p.image}
                          alt={p.name}
                          loading="lazy"
                          decoding="async"
                          className="w-full h-full object-cover"
                        />
                        {subItems.length > 1 && (
                          <div className="absolute bottom-1 right-1 bg-black/60 text-white text-[8.5px] font-bold px-1.5 py-0.5 rounded flex items-center gap-1">
                            <Palette size={10} />
                            <span>{subItems.length}</span>
                          </div>
                        )}
                      </div>

                      <span className="text-[8.5px] font-extrabold text-[#8C7078] uppercase truncate block">
                        {p.brandName || p.category}
                      </span>
                      <h5 className="text-[11px] font-bold text-[#3A2430] line-clamp-2 leading-tight mb-1">
                        {p.name}
                      </h5>

                      <div className="flex items-baseline gap-1 mt-1">
                        <span className="text-xs font-black text-[#C2477A]">₹{pPrice}</span>
                        {pMrp > pPrice && (
                          <span className="text-[9px] text-[#8C7078] line-through">₹{pMrp}</span>
                        )}
                      </div>
                    </div>

                    <div className="mt-2 py-1 rounded-xl bg-[#FFF0F5] border border-[#FCE4EC] text-center">
                      <span className="text-[9.5px] font-bold text-[#C2477A]">
                        View Details
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* ── 7. QUICK SHADE SELECTION MODAL FOR WEB ── */}
      {quickShadeModalItem && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fade-in">
          <div className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-3xl border border-[#FCE4EC] p-5 shadow-2xl space-y-4 max-h-[85vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-[#FCE4EC]">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-[#FFF0F5] text-[#C2477A] flex items-center justify-center border border-[#FCE4EC]">
                  <Sparkles size={16} />
                </div>
                <div>
                  <h4 className="text-xs font-black text-[#3A2430] uppercase">Select Your Shade</h4>
                  <span className="text-[10px] text-[#8C7078] block truncate max-w-[240px]">
                    {quickShadeModalItem.name}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setQuickShadeModalItem(null)}
                className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-600 transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Selected Shade Preview */}
            {selectedQuickShade && (
              <div className="flex items-center gap-3 bg-[#FFF5F8] p-3 rounded-2xl border border-[#FCE4EC]">
                <img
                  src={selectedQuickShade.image || quickShadeModalItem.image}
                  alt={selectedQuickShade.name}
                  className="w-12 h-12 rounded-xl object-cover border border-[#FCE4EC]"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-1.5">
                    {selectedQuickShade.hexColor && (
                      <span
                        style={{ backgroundColor: selectedQuickShade.hexColor }}
                        className="w-3.5 h-3.5 rounded-full border border-white shadow-2xs inline-block"
                      />
                    )}
                    <span className="text-xs font-extrabold text-[#3A2430]">
                      {selectedQuickShade.name}
                    </span>
                  </div>
                  <span className="text-sm font-black text-[#C2477A] block mt-0.5">
                    ₹{getRolePrice(quickShadeModalItem, userRole, selectedQuickShade, 1)}
                  </span>
                </div>
              </div>
            )}

            {/* Shades Grid / Row */}
            <div>
              <span className="text-[10px] font-black text-[#8C7078] uppercase tracking-wider block mb-2">
                Available Options ({getSafeProductShades(quickShadeModalItem).length})
              </span>
              <div className="grid grid-cols-3 gap-2 max-h-48 overflow-y-auto p-1">
                {getSafeProductShades(quickShadeModalItem).map((shade, idx) => {
                  const isSel = selectedQuickShade && (selectedQuickShade.id === shade.id || selectedQuickShade.name === shade.name);
                  const sPrice = getRolePrice(quickShadeModalItem, userRole, shade, 1);
                  return (
                    <button
                      key={shade.id || idx}
                      onClick={() => setSelectedQuickShade(shade)}
                      className={`p-2 rounded-2xl border text-center transition-all cursor-pointer ${
                        isSel ? 'bg-[#FFF0F5] border-[#C2477A] shadow-xs' : 'bg-white border-[#FCE4EC] hover:border-gray-300'
                      }`}
                    >
                      <div className="relative w-12 h-12 mx-auto rounded-xl overflow-hidden mb-1 bg-[#FFF5F8] flex items-center justify-center">
                        <img
                          src={shade.image || quickShadeModalItem.image}
                          alt={shade.name}
                          className="w-full h-full object-cover"
                        />
                        {shade.hexColor && (
                          <span
                            style={{ backgroundColor: shade.hexColor }}
                            className="absolute bottom-0.5 right-0.5 w-3 h-3 rounded-full border border-white"
                          />
                        )}
                        {isSel && (
                          <span className="absolute top-0.5 left-0.5 bg-[#C2477A] text-white w-3.5 h-3.5 rounded-full flex items-center justify-center text-[8px]">
                            ✓
                          </span>
                        )}
                      </div>
                      <span className={`text-[10px] font-bold block truncate ${isSel ? 'text-[#C2477A]' : 'text-[#3A2430]'}`}>
                        {shade.name}
                      </span>
                      <span className="text-[10px] font-black text-[#C2477A] block mt-0.5">
                        ₹{sPrice}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Confirm Add Button */}
            <button
              onClick={handleConfirmQuickShadeAdd}
              className="w-full py-3.5 rounded-2xl bg-[#C2477A] hover:bg-[#a83765] text-white font-black text-xs uppercase tracking-wider shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <ShoppingBag size={15} />
              <span>
                Add {selectedQuickShade ? selectedQuickShade.name : 'Selected'} To Bag • ₹{getRolePrice(quickShadeModalItem, userRole, selectedQuickShade, 1)}
              </span>
            </button>
          </div>
        </div>
      )}

      {/* 5. Fixed Bottom Action Bar (Positioned directly above the bottom navigation bar) */}
      <div className="fixed bottom-[53px] left-0 right-0 max-w-md mx-auto bg-white border-t border-gray-200 p-3 z-40 shadow-xl flex items-center justify-between">
        <div className="flex flex-col">
          <span className="text-[10px] text-[#8C7078] font-bold">
            {selectedShade ? `Shade: ${selectedShade.title || selectedShade.name}` : (baseProduct.category || 'Standard Product')}
          </span>
          <span className="text-base font-black text-[#3A2430]">₹{currentRolePrice * (cartQty || 1)}</span>
          <span className="text-[8.5px] text-[#8C7078]">Inclusive of all taxes</span>
        </div>

        {/* Big Solid Action Button */}
        {cartQty > 0 ? (
          <div className="bg-[#C2477A] text-white rounded-xl px-4 py-2.5 flex items-center gap-3 shadow-md">
            <button onClick={handleDecrement} className="text-white text-base font-black px-1 cursor-pointer hover:opacity-80">-</button>
            <span className="text-sm font-black text-white px-1 min-w-[16px] text-center">{cartQty}</span>
            <button onClick={handleIncrement} className="text-white text-base font-black px-1 cursor-pointer hover:opacity-80">+</button>
          </div>
        ) : (
          <button
            onClick={handleAddToCart}
            className="px-7 py-3 rounded-xl text-xs font-black shadow-md transition-all cursor-pointer bg-[#C2477A] text-white hover:bg-[#a83765] active:scale-[0.98]"
          >
            Add to cart
          </button>
        )}
      </div>
    </div>
  );
};
