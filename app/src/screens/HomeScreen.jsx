import React from 'react';
import { useApp } from '../context/AppContext';
import { Search, ShoppingBag, MapPin, ChevronRight, Star, Tag, Sparkles } from 'lucide-react';

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
    selectedBranch,
    setSelectedBranch
  } = useApp();

  const cartItemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const roleLabels = {
    general: 'Retail Customer',
    salon: 'Salon Owner Pricing',
    artist: 'Makeup Artist Pricing',
    beautician: 'Beautician Pricing',
  };

  return (
    <div className="pb-24 animate-fade-in">
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

      <div className="p-4">
        <div className="relative rounded-2xl overflow-hidden bg-gradient-to-r from-[#C2477A] via-[#E27396] to-[#F5A8C0] p-6 text-white shadow-lg">
          <div className="relative z-10 max-w-[70%]">
            <span className="inline-block bg-white/20 backdrop-blur-md text-white text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full mb-2">
              Exclusive Beauty Perks
            </span>
            <h2 className="text-xl font-bold leading-tight mb-1">Professional Salbeau Tier Savings</h2>
            <p className="text-xs text-white/90 mb-3">Up to 35% discount for verified Salon & Artist profiles.</p>
            <button
              onClick={() => setCurrentScreen('onboarding')}
              className="bg-white text-[#C2477A] font-bold text-xs px-4 py-2 rounded-xl shadow-md hover:bg-[#FCE4EC]"
            >
              Explore Tiers
            </button>
          </div>
          <div className="absolute right-[-10px] bottom-[-20px] opacity-30 text-7xl select-none pointer-events-none">
            💄
          </div>
        </div>
      </div>

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

      <div className="px-4">
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
                    {hasDiscount && (
                      <span className="absolute top-2 left-2 bg-[#C2477A] text-white text-[9px] font-bold px-2 py-0.5 rounded-full uppercase">
                        {Math.round(((product.mrp - rolePrice) / product.mrp) * 100)}% OFF
                      </span>
                    )}
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
                    <div className="text-[9px] text-[#8C7078]">In Stock ({product.stock})</div>
                  </div>

                  <button className="w-7 h-7 rounded-full bg-[#FCE4EC] text-[#C2477A] font-bold text-sm">
                    +
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
