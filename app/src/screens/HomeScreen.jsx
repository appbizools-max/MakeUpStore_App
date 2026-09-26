import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext.jsx';
import { Search, ShoppingBag, MapPin, ChevronRight, ChevronLeft, Star, Tag, Sparkles, ArrowRight, Heart, Scissors, Palette, Leaf, Gift, Sun } from 'lucide-react';

export const HomeScreen = () => {
  const {
    activeProducts,
    activeBrands,
    categories,
    userRole,
    getRolePrice,
    setSelectedProduct,
    setSelectedCategory,
    setSelectedBrand,
    setCurrentScreen,
    cart,
    addToCart,
    selectedBranch,
    setSelectedBranch,
    homeSectionVisibility
  } = useApp();

  const [activeSlide, setActiveSlide] = useState(0);

  const heroSlides = [
    {
      id: 'hs1',
      badge: 'EXCLUSIVE PRO TIER',
      title: 'Autumn Glamour & Glass Glow',
      subtitle: 'Up to 35% Wholesale Pricing for Salon Pros & Artists',
      ctaText: 'Explore Pro Rates →',
      image: 'https://images.unsplash.com/photo-1512496015851-a90fb38ba796?w=1000&auto=format&fit=crop&q=80',
      screen: 'onboarding'
    },
    {
      id: 'hs2',
      badge: '365+ VERIFIED BRANDS',
      title: '100% Authentic Beauty Direct Supplies',
      subtitle: 'L\'Oréal, M.A.C, Maybelline, Agaro, Biotique & More In-Stock',
      ctaText: 'Browse All Brands →',
      image: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=1000&auto=format&fit=crop&q=80',
      screen: 'search'
    },
    {
      id: 'hs3',
      badge: 'SAME DAY EXPRESS DISPATCH',
      title: 'Store Pickup & Express Shipping',
      subtitle: 'Realtime order tracking & wholesale tier invoice receipts',
      ctaText: 'Shop Best Sellers →',
      image: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=1000&auto=format&fit=crop&q=80',
      screen: 'search'
    }
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveSlide(prev => (prev + 1) % heroSlides.length);
    }, 3800);
    return () => clearInterval(timer);
  }, [heroSlides.length]);

  const cartItemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const roleLabels = {
    general: 'Retail Customer',
    salon: 'Salon Owner Pricing',
    artist: 'Makeup Artist Pricing',
    beautician: 'Beautician Pricing',
  };

  const beautyEssentials = [
    { id: 'be1', title: 'Face Serums', icon: Sparkles, subtitle: 'Radiance & Hydration' },
    { id: 'be2', title: 'Hair Care Oils', icon: Scissors, subtitle: 'Nourishment & Spa' },
    { id: 'be3', title: 'Lipsticks & Oils', icon: Palette, subtitle: 'Velvet & Gloss Shades' },
    { id: 'be4', title: 'Aloevera & Gels', icon: Leaf, subtitle: 'Pure Organic Care' },
    { id: 'be5', title: 'Waxing & Kits', icon: Gift, subtitle: 'Salon Smooth Finish' },
    { id: 'be6', title: 'Sunscreen Shield', icon: Sun, subtitle: 'Broad Spectrum UV' }
  ];

  const recommendedProducts = [
    {
      id: 'rec1',
      brandName: 'DERMAVIVE',
      name: 'Hydrating Hydra-Boost Serum 50ml',
      image: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=600&auto=format&fit=crop&q=80',
      rating: '4.9',
      mrp: 999,
      salonPrice: 749,
      artistPrice: 699,
      beauticianPrice: 719,
      stock: 15
    },
    {
      id: 'rec2',
      brandName: 'BIOTIQUE',
      name: 'Bio Kelp Protein Conditioner',
      image: 'https://images.unsplash.com/photo-1535585209827-a15fcdbc4c2d?w=600&auto=format&fit=crop&q=80',
      rating: '4.6',
      mrp: 350,
      salonPrice: 245,
      artistPrice: 229,
      beauticianPrice: 235,
      stock: 20
    }
  ];

  const recentlyViewedProducts = [
    { id: 'rv1', name: 'Glaze Lip Oil', brandName: 'SALBEAU', image: 'https://images.unsplash.com/photo-1625093742435-6fa192b6fb10?w=300', price: 399 },
    { id: 'rv2', name: 'Matte Foundation', brandName: 'M.A.C', image: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=300', price: 1099 },
    { id: 'rv3', name: 'Hair Repair Mask', brandName: "L'ORÉAL", image: 'https://images.unsplash.com/photo-1527799820374-dcf8d9d4a388?w=300', price: 629 }
  ];

  return (
    <div className="pb-24 animate-fade-in">
      {/* ---------------- 1. EXISTING HEADER ---------------- */}
      {homeSectionVisibility?.branchBar !== false && (
        <div className="sticky top-0 z-20 bg-white/95 backdrop-blur-md px-4 py-3 border-b border-[#FCE4EC] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-[#FCE4EC] flex items-center justify-center text-[#C2477A]">
              <MapPin size={16} />
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-wider text-[#8C7078] font-semibold">Store Branch</div>
              <select
                value={selectedBranch}
                onChange={(e) => setSelectedBranch(e.target.value)}
                className="text-xs font-semibold text-[#3A2430] bg-transparent outline-none cursor-pointer pr-2"
              >
                <option value="MG Road Branch">MG Road Branch ▾</option>
                <option value="Indiranagar Branch">Indiranagar Branch ▾</option>
                <option value="Koramangala Branch">Koramangala Branch ▾</option>
                <option value="Jayanagar Branch">Jayanagar Branch ▾</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentScreen('search')}
              className="w-9 h-9 rounded-full bg-white border border-[#FCE4EC] flex items-center justify-center text-[#C2477A] shadow-sm hover:bg-[#FCE4EC]"
            >
              <Search size={18} />
            </button>
            <button
              onClick={() => setCurrentScreen('cart')}
              className="relative w-9 h-9 rounded-full bg-[#C2477A] text-white flex items-center justify-center shadow-md hover:bg-[#a83765]"
            >
              <ShoppingBag size={18} />
              {cartItemCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-[#F5A8C0] text-[#3A2430] font-bold text-[10px] w-5 h-5 rounded-full flex items-center justify-center border-2 border-white">
                  {cartItemCount}
                </span>
              )}
            </button>
          </div>
        </div>
      )}

      {/* ---------------- 2. EXISTING ROLE BAR ---------------- */}
      {homeSectionVisibility?.pricingRoleBanner !== false && (
        <div className="bg-gradient-to-r from-[#FCE4EC] to-[#FFF8FA] px-4 py-2.5 border-b border-[#FCE4EC]/60 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Sparkles size={14} className="text-[#C2477A]" />
            <span className="text-xs text-[#8C7078] font-medium">Pricing Mode:</span>
            <span className="text-xs font-bold text-[#C2477A] bg-white px-2 py-0.5 rounded-full border border-[#F5A8C0]">
              {roleLabels[userRole]}
            </span>
          </div>
          <button
            onClick={() => setCurrentScreen('onboarding')}
            className="text-xs font-semibold text-[#C2477A] underline hover:text-[#a83765]"
          >
            Change Role
          </button>
        </div>
      )}

      {/* ---------------- 3. HERO SLIDER BANNER (CLEAN WITH BUTTON ONLY) ---------------- */}
      {homeSectionVisibility?.heroPromoBanner !== false && (
        <div className="p-4">
          <div className="relative rounded-2xl overflow-hidden shadow-lg bg-[#FCE4EC] h-48 border border-[#FCE4EC]">
            <img
              src={heroSlides[activeSlide].image}
              alt="Hero Banner"
              className="w-full h-full object-cover transition-all duration-700"
            />

            <div className="absolute bottom-3.5 left-3.5">
              <button
                onClick={() => setCurrentScreen(heroSlides[activeSlide].screen || 'onboarding')}
                className="bg-white text-[#C2477A] font-extrabold text-xs px-4 py-2 rounded-xl shadow-md border border-pink-100 hover:bg-[#FFF5F8] transition-all"
              >
                {heroSlides[activeSlide].ctaText || 'Shop Collection →'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ---------------- 4. EXISTING SHOP CATEGORIES ---------------- */}
      {homeSectionVisibility?.shopCategories !== false && (
        <div className="mb-6">
          <div className="px-4 flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-[#3A2430] uppercase tracking-wider">Shop Categories</h3>
            <span className="text-xs text-[#C2477A] font-semibold cursor-pointer">View All</span>
          </div>
          <div className="flex overflow-x-auto gap-3 px-4 no-scrollbar pb-1">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => {
                  setSelectedCategory(cat);
                  setCurrentScreen('category');
                }}
                className="flex-shrink-0 flex flex-col items-center gap-1.5 group"
              >
                <div
                  className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl shadow-sm border border-[#F5A8C0]/30 transition-transform group-hover:scale-105"
                  style={{ backgroundColor: cat.color }}
                >
                  {cat.icon}
                </div>
                <span className="text-xs font-medium text-[#3A2430] text-center w-16 truncate">
                  {cat.name}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ---------------- 5. EXISTING FEATURED BRANDS ---------------- */}
      {homeSectionVisibility?.featuredBrands !== false && (
        <div className="mb-6 bg-white/70 py-4 border-y border-[#FCE4EC]">
          <div className="px-4 flex items-center justify-between mb-3">
            <div>
              <h3 className="text-sm font-bold text-[#3A2430] uppercase tracking-wider">Featured Brands</h3>
              <p className="text-[11px] text-[#8C7078]">Only active partner brands shown</p>
            </div>
            <button
              onClick={() => setCurrentScreen('brand')}
              className="text-xs text-[#C2477A] font-semibold flex items-center gap-0.5"
            >
              All Brands <ChevronRight size={14} />
            </button>
          </div>

          <div className="flex overflow-x-auto gap-3 px-4 no-scrollbar">
            {activeBrands.map((brand) => (
              <button
                key={brand.id}
                onClick={() => {
                  setSelectedBrand(brand);
                  setCurrentScreen('brand');
                }}
                className="flex-shrink-0 bg-white border border-[#F5A8C0]/50 rounded-xl px-4 py-2.5 flex items-center gap-2.5 shadow-sm hover:border-[#C2477A]"
              >
                <span className="text-xl">{brand.logo}</span>
                <div className="text-left">
                  <div className="text-xs font-bold text-[#3A2430] whitespace-nowrap">{brand.name}</div>
                  <div className="text-[10px] text-[#8C7078]">{brand.category}</div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ---------------- 6. EXISTING BEST SELLERS ---------------- */}
      {homeSectionVisibility?.bestSellers !== false && (
        <div className="px-4 mb-8">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-1.5">
              <Tag size={16} className="text-[#C2477A]" />
              <h3 className="text-sm font-bold text-[#3A2430] uppercase tracking-wider">Best Sellers</h3>
            </div>
            <span className="text-xs text-[#C2477A] font-semibold">{activeProducts.length} items</span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {activeProducts.map((product) => {
              const rolePrice = getRolePrice(product, userRole);
              const hasDiscount = userRole !== 'general' && rolePrice < product.mrp;
              const isOutOfStock = product.stock === 0;

              return (
                <div
                  key={product.id}
                  onClick={() => {
                    setSelectedProduct(product);
                    setCurrentScreen('product');
                  }}
                  className="bg-white rounded-2xl border border-[#FCE4EC] overflow-hidden shadow-sm hover:shadow-md transition-all cursor-pointer flex flex-col justify-between"
                >
                  <div>
                    <div className="relative aspect-square bg-[#FCE4EC]/40 overflow-hidden">
                      <img src={product.image} alt={product.name} className={`w-full h-full object-cover ${isOutOfStock ? 'opacity-40' : ''}`} />
                      {isOutOfStock ? (
                        <span className="absolute inset-0 bg-black/40 backdrop-blur-[1px] flex items-center justify-center text-white text-[10px] font-black uppercase tracking-wider">
                          Out of Stock
                        </span>
                      ) : hasDiscount ? (
                        <span className="absolute top-2 left-2 bg-[#C2477A] text-white text-[9px] font-bold px-2 py-0.5 rounded-full uppercase">
                          {Math.round(((product.mrp - rolePrice) / product.mrp) * 100)}% OFF
                        </span>
                      ) : null}
                      <span className="absolute top-2 right-2 bg-white/90 text-[#3A2430] text-[10px] font-bold px-1.5 py-0.5 rounded flex items-center gap-0.5 shadow-sm">
                        <Star size={10} className="fill-[#F5A8C0] text-[#C2477A]" /> {product.rating}
                      </span>
                    </div>

                    <div className="p-3">
                      <div className="text-[10px] uppercase font-bold tracking-wider text-[#8C7078] mb-0.5">
                        {product.brandName}
                      </div>
                      <h4 className="text-xs font-semibold text-[#3A2430] line-clamp-2 leading-snug mb-2">
                        {product.name}
                      </h4>
                    </div>
                  </div>

                  <div className="px-3 pb-3 pt-1 border-t border-[#FCE4EC]/50 flex items-center justify-between">
                    <div>
                      {hasDiscount ? (
                        <div className="flex items-baseline gap-1.5">
                          <span className="text-sm font-bold text-[#C2477A]">₹{rolePrice}</span>
                          <span className="text-[11px] text-[#8C7078] line-through">₹{product.mrp}</span>
                        </div>
                      ) : (
                        <span className="text-sm font-bold text-[#3A2430]">₹{product.mrp}</span>
                      )}
                      {isOutOfStock ? (
                        <div className="text-[9px] text-rose-600 font-bold">Out of Stock</div>
                      ) : (
                        <div className="text-[9px] text-[#4C8C5C] font-semibold">In Stock ({product.stock})</div>
                      )}
                    </div>

                    <button
                      disabled={isOutOfStock}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (!isOutOfStock) addToCart(product, 1);
                      }}
                      className={`w-7 h-7 rounded-full font-bold text-sm flex items-center justify-center transition-colors ${
                        isOutOfStock ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-[#FCE4EC] text-[#C2477A] hover:bg-[#C2477A] hover:text-white'
                      }`}
                    >
                      +
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 💥 NEW ADDITIONS BELOW CURRENT EXISTING CONTENT (100% PRESERVED ABOVE) 💥 */}
      {/* ========================================================================= */}

      {/* NEW SECTION 1: BEAUTY EDIT */}
      <div className="px-4 mb-8">
        <h3 className="text-sm font-bold text-[#3A2430] uppercase tracking-wider mb-3">Beauty Edit</h3>
        <div className="bg-white rounded-2xl border border-[#FCE4EC] overflow-hidden shadow-sm">
          <div className="relative h-36 bg-[#FCE4EC]">
            <img src="https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=800&auto=format&fit=crop&q=80" alt="Beauty Edit" className="w-full h-full object-cover" />
            <span className="absolute top-3 left-3 bg-[#C2477A] text-white text-[9px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full">
              THE SALBEAU EDIT
            </span>
          </div>
          <div className="p-4 bg-white">
            <h4 className="text-sm font-bold text-[#3A2430] mb-1">Autumn Gloss & Radiance Rituals</h4>
            <p className="text-xs text-[#8C7078] leading-relaxed mb-3">
              Discover curated autumn beauty masterclasses, pro artist tricks, and hydration secrets for glass skin.
            </p>
            <button onClick={() => setCurrentScreen('search')} className="text-xs font-bold text-[#C2477A] flex items-center gap-1 hover:underline">
              Read Beauty Journal <ArrowRight size={13} />
            </button>
          </div>
        </div>
      </div>


      {/* NEW SECTION 3: RECOMMENDED FOR YOU */}
      <div className="px-4 mb-8">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-[#3A2430] uppercase tracking-wider">Recommended For You</h3>
          <span onClick={() => setCurrentScreen('search')} className="text-xs font-semibold text-[#C2477A] cursor-pointer">See All</span>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {recommendedProducts.map((product) => {
            const rolePrice = getRolePrice(product, userRole);
            return (
              <div
                key={product.id}
                onClick={() => {
                  setSelectedProduct(product);
                  setCurrentScreen('product');
                }}
                className="bg-white rounded-2xl border border-[#FCE4EC] overflow-hidden shadow-sm hover:shadow-md transition-all cursor-pointer flex flex-col justify-between"
              >
                <div>
                  <div className="relative aspect-square bg-[#FCE4EC]/40 overflow-hidden">
                    <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                    <span className="absolute top-2 right-2 bg-white/90 text-[#3A2430] text-[10px] font-bold px-1.5 py-0.5 rounded flex items-center gap-0.5 shadow-sm">
                      <Star size={10} className="fill-[#F5A8C0] text-[#C2477A]" /> {product.rating}
                    </span>
                  </div>

                  <div className="p-3">
                    <div className="text-[10px] uppercase font-bold tracking-wider text-[#8C7078] mb-0.5">
                      {product.brandName}
                    </div>
                    <h4 className="text-xs font-semibold text-[#3A2430] line-clamp-2 leading-snug mb-2">
                      {product.name}
                    </h4>
                  </div>
                </div>

                <div className="px-3 pb-3 pt-1 border-t border-[#FCE4EC]/50 flex items-center justify-between">
                  <div>
                    <span className="text-sm font-bold text-[#C2477A]">₹{rolePrice}</span>
                    <span className="text-[11px] text-[#8C7078] line-through ml-1.5">₹{product.mrp}</span>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      addToCart(product, 1);
                    }}
                    className="w-7 h-7 rounded-full font-bold text-sm bg-[#FCE4EC] text-[#C2477A] hover:bg-[#C2477A] hover:text-white flex items-center justify-center transition-colors"
                  >
                    +
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* NEW SECTION 4: ESSENTIAL BEAUTY STAPLES */}
      <div className="px-4 mb-8">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-sm font-bold text-[#3A2430] uppercase tracking-wider">Essential Beauty Staples</h3>
            <p className="text-[11px] text-[#8C7078]">Handpicked pro catalog favorites</p>
          </div>
          <span onClick={() => setCurrentScreen('search')} className="text-xs font-semibold text-[#C2477A] cursor-pointer">Explore All →</span>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {beautyEssentials.map((item) => {
            const IconComp = item.icon;
            return (
              <div
                key={item.id}
                onClick={() => setCurrentScreen('search')}
                className="bg-white rounded-2xl border border-[#FCE4EC] p-3 flex items-center gap-3 shadow-2xs hover:border-[#F5A8C0] cursor-pointer transition-all"
              >
                <div className="w-10 h-10 rounded-2xl flex items-center justify-center bg-[#FFF5F8] border border-[#FCE4EC] shrink-0 text-[#C2477A]">
                  <IconComp size={18} />
                </div>
                <div className="overflow-hidden">
                  <div className="text-xs font-bold text-[#3A2430] truncate">{item.title}</div>
                  <div className="text-[10px] text-[#8C7078] truncate">{item.subtitle}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* NEW SECTION 5: RECENTLY VIEWED */}
      <div className="mb-8">
        <h3 className="text-sm font-bold text-[#3A2430] uppercase tracking-wider px-4 mb-3">Recently Viewed</h3>
        <div className="flex overflow-x-auto gap-3 px-4 no-scrollbar">
          {recentlyViewedProducts.map((rv) => (
            <div
              key={rv.id}
              onClick={() => setCurrentScreen('product')}
              className="flex-shrink-0 w-28 bg-white border border-[#FCE4EC] rounded-2xl p-2.5 text-center shadow-2xs cursor-pointer hover:border-[#F5A8C0]"
            >
              <div className="w-16 h-16 rounded-xl overflow-hidden mb-2 mx-auto bg-[#FFF5F8] border border-[#FCE4EC]">
                <img src={rv.image} alt={rv.name} className="w-full h-full object-cover" />
              </div>
              <div className="text-[9px] font-bold text-[#C2477A] uppercase">{rv.brandName}</div>
              <div className="text-xs font-semibold text-[#3A2430] truncate">{rv.name}</div>
              <div className="text-xs font-bold text-[#C2477A] mt-1">₹{rv.price}</div>
            </div>
          ))}
        </div>
      </div>

      {/* NEW SECTION 6: COMPLETE YOUR LOOK */}
      <div className="px-4 mb-8">
        <h3 className="text-sm font-bold text-[#3A2430] uppercase tracking-wider mb-3">Complete Your Look</h3>
        <div className="bg-[#FFF5F8] rounded-2xl p-4 border border-[#FCE4EC] shadow-2xs flex items-center justify-between gap-3">
          <div className="flex-1">
            <span className="text-[9px] font-black text-[#C2477A] uppercase tracking-wider block mb-0.5">DUO BEAUTY BUNDLE</span>
            <h4 className="text-xs font-bold text-[#3A2430] mb-1">Hydrating Lip Oil + Velvet Blush</h4>
            <p className="text-[11px] text-[#8C7078] mb-2 leading-relaxed">Save 20% extra when buying this salon radiance duo.</p>
            <button onClick={() => setCurrentScreen('cart')} className="bg-[#C2477A] text-white text-xs font-bold px-3 py-1.5 rounded-xl hover:bg-[#a83765]">
              Add Bundle ₹899 →
            </button>
          </div>
          <div className="w-20 h-20 rounded-xl overflow-hidden bg-white border border-[#F5A8C0] flex-shrink-0">
            <img src="https://images.unsplash.com/photo-1625093742435-6fa192b6fb10?w=300" alt="Bundle" className="w-full h-full object-cover" />
          </div>
        </div>
      </div>

      {/* NEW SECTION 7: SEASONAL BEAUTY COLLECTION */}
      <div className="px-4 mb-4">
        <div className="rounded-2xl overflow-hidden border border-[#FCE4EC] bg-white shadow-sm">
          <div className="relative h-36 bg-[#FCE4EC]">
            <img src="https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=800&auto=format&fit=crop&q=80" alt="Collection" className="w-full h-full object-cover" />
            <span className="absolute top-3 left-3 bg-white/90 text-[#C2477A] text-[9px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full">
              SEASONAL COLLECTION
            </span>
          </div>
          <div className="p-4 flex items-center justify-between">
            <div>
              <h4 className="text-xs font-bold text-[#3A2430]">Luxe Bridal & Salon Master Series</h4>
              <p className="text-[11px] text-[#8C7078]">Professional bridal kits with long-wear formulas.</p>
            </div>
            <button onClick={() => setCurrentScreen('search')} className="bg-[#C2477A] text-white text-xs font-bold px-3 py-2 rounded-xl hover:bg-[#a83765]">
              Explore →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
