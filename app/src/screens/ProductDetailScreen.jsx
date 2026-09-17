import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext.jsx';
import {
  ChevronLeft,
  ChevronRight,
  ShoppingBag,
  Heart,
  CheckCircle2
} from 'lucide-react';

export const ProductDetailScreen = () => {
  const {
    selectedProduct,
    setSelectedProduct,
    activeProducts,
    userRole,
    getRolePrice,
    addToCart,
    updateCartQuantity,
    removeFromCart,
    cart,
    setCurrentScreen,
  } = useApp();

  const [addedToast, setAddedToast] = useState(false);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Reset slider index when product changes
  useEffect(() => {
    setCurrentImageIndex(0);
  }, [selectedProduct?.id]);

  const productImages = (selectedProduct?.images && selectedProduct.images.length > 0)
    ? selectedProduct.images
    : [
        selectedProduct?.image || 'https://images.unsplash.com/photo-1625093742435-6fa192b6fb10?w=600',
        'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=600',
        'https://images.unsplash.com/photo-1512496015851-a90fb38ba796?w=600',
        'https://images.unsplash.com/photo-1586495777744-4413f21062fa?w=600'
      ];

  // Automatic image slider timer (cycles every 3 seconds)
  useEffect(() => {
    if (!productImages || productImages.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % productImages.length);
    }, 3000);

    return () => clearInterval(interval);
  }, [productImages.length]);

  const rolePrice = getRolePrice(selectedProduct, userRole);
  const displayMrp = selectedProduct.mrp && selectedProduct.mrp > rolePrice ? Number(selectedProduct.mrp) : Math.round(rolePrice * 1.25);
  const hasDiscount = displayMrp > rolePrice;
  const savings = displayMrp - rolePrice;
  const discountPercent = Math.round((savings / displayMrp) * 100);
  const isOutOfStock = selectedProduct.stock === 0;

  const cartItem = (cart || []).find(c => c.id === selectedProduct.id || c.product?.id === selectedProduct.id);
  const cartQty = cartItem ? cartItem.quantity : 0;

  const similarProducts = (activeProducts || []).filter(p => p.id !== selectedProduct.id).slice(0, 6);

  const handleAddToCart = () => {
    if (isOutOfStock) return;
    addToCart(selectedProduct, 1);
    setAddedToast(true);
    setTimeout(() => setAddedToast(false), 2500);
  };

  const handleIncrement = () => {
    if (isOutOfStock) return;
    if (cartQty === 0) {
      addToCart(selectedProduct, 1);
    } else {
      updateCartQuantity(selectedProduct.id, cartQty + 1);
    }
  };

  const handleDecrement = () => {
    if (cartQty > 1) {
      updateCartQuantity(selectedProduct.id, cartQty - 1);
    } else if (cartQty === 1) {
      removeFromCart(selectedProduct.id);
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
          onClick={() => setIsWishlisted(!isWishlisted)}
          className="w-10 h-10 rounded-full bg-white/90 backdrop-blur-md border border-[#FCE4EC] flex items-center justify-center shadow-sm hover:bg-white transition-colors cursor-pointer"
        >
          <Heart size={20} className={isWishlisted ? "fill-[#C2477A] text-[#C2477A]" : "text-[#C2477A]"} />
        </button>
      </div>
      
      {/* Added Toast Notification */}
      {addedToast && (
        <div className="fixed top-14 left-4 right-4 z-40 p-3 bg-emerald-600 text-white rounded-xl text-xs font-extrabold flex items-center justify-between shadow-xl animate-fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={18} />
            <span>Added to your Cart!</span>
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
            className={`max-h-full max-w-full object-contain transition-all duration-300 ${isOutOfStock ? 'opacity-40' : ''}`}
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

          {isOutOfStock && (
            <span className="absolute bg-rose-600 text-white font-black text-[10px] uppercase px-3 py-1 rounded-full shadow-md">
              Out of Stock
            </span>
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
            {selectedProduct.brandName}
          </span>

          {/* Title & Size/Volume */}
          <h1 className="text-base font-black text-[#3A2430] leading-snug pt-1">
            {selectedProduct.name}
          </h1>
          <span className="inline-block text-xs font-bold text-[#8C7078]">
            {selectedProduct.category} • Net Vol. 500 ml / 15g
          </span>

          {/* Description */}
          <p className="text-xs text-[#8C7078] leading-relaxed pt-1 border-t border-gray-50">
            {selectedProduct.description || 'Professional grade cosmetic formulation designed for long-lasting, smudge-proof perfection. Dermatologically tested for sensitive skin.'}
          </p>

          {/* Price Row */}
          <div className="pt-2 flex items-baseline gap-2">
            <span className="text-xs font-black text-[#8C7078] uppercase">MRP</span>
            <span className="text-xl font-black text-[#3A2430]">₹{rolePrice}</span>
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
        </div>

        {/* 4. Similar Products Section */}
        {similarProducts.length > 0 && (
          <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-2xs space-y-3">
            <h3 className="text-sm font-extrabold text-[#3A2430]">Similar products</h3>
            <div className="flex gap-2.5 overflow-x-auto no-scrollbar pb-1">
              {similarProducts.map(p => {
                const sPrice = getRolePrice(p, userRole);
                return (
                  <div
                    key={p.id}
                    onClick={() => {
                      setSelectedProduct(p);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className="w-32 flex-shrink-0 bg-white border border-gray-100 rounded-xl p-2 cursor-pointer hover:border-[#C2477A]/40 transition-all"
                  >
                    <img src={p.image} alt={p.name} className="w-full h-24 object-cover rounded-lg mb-1.5 border border-gray-100" />
                    <span className="text-[8px] font-extrabold text-[#8C7078] uppercase truncate block">{p.brandName}</span>
                    <h5 className="text-[10px] font-bold text-[#3A2430] truncate">{p.name}</h5>
                    <span className="text-xs font-black text-[#C2477A] block mt-1">₹{sPrice}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* 5. Fixed Bottom Action Bar (Positioned directly above the bottom navigation bar) */}
      <div className="fixed bottom-[53px] left-0 right-0 max-w-md mx-auto bg-white border-t border-gray-200 p-3 z-40 shadow-xl flex items-center justify-between">
        <div className="flex flex-col">
          <span className="text-[10px] text-[#8C7078] font-bold">500 ml / 1 Unit</span>
          <span className="text-base font-black text-[#3A2430]">₹{rolePrice * (cartQty || 1)}</span>
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
            disabled={isOutOfStock}
            onClick={handleAddToCart}
            className={`px-7 py-3 rounded-xl text-xs font-black shadow-md transition-all cursor-pointer ${
              isOutOfStock
                ? 'bg-gray-200 text-gray-400 cursor-not-allowed shadow-none'
                : 'bg-[#C2477A] text-white hover:bg-[#a83765] active:scale-[0.98]'
            }`}
          >
            Add to cart
          </button>
        )}
      </div>
    </div>
  );
};
