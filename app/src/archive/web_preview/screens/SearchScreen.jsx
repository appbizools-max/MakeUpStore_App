import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext.jsx';
import { Search, ChevronLeft, Star, X, Heart, ShoppingBag, SlidersHorizontal, ArrowRight } from 'lucide-react';

import { matchProductSearch } from '../utils/productSearchEngine';
import { trackCustomerSearch } from '../utils/customerSearchService';

export const SearchScreen = () => {
  const {
    activeProducts,
    activeBrands,
    categories,
    userRole,
    userProfile,
    getRolePrice,
    setSelectedProduct,
    setCurrentScreen,
    addToCart,
    updateCartQuantity,
    cart = [],
    isFavorite,
    toggleFavorite,
    globalSearchQuery,
    setGlobalSearchQuery
  } = useApp();

  const [query, setQuery] = useState(globalSearchQuery || '');
  const [selectedCatName, setSelectedCatName] = useState('All');
  const [selectedBrandName, setSelectedBrandName] = useState('All');
  const [priceFilter, setPriceFilter] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const searchInputRef = useRef(null);

  // Pre-fill from global search query (coming from Home search bar)
  useEffect(() => {
    if (globalSearchQuery) {
      setQuery(globalSearchQuery);
      setGlobalSearchQuery(''); // consume so it doesn't re-apply on re-mount
    }
    // autofocus
    setTimeout(() => searchInputRef.current?.focus(), 100);
  }, []);

  const cartQuantityMap = useMemo(() => {
    const map = new Map();
    for (const item of cart) {
      if (item.product?.id) map.set(item.product.id, item.quantity || 0);
    }
    return map;
  }, [cart]);

  const filteredProducts = useMemo(() => {
    const q = query.trim();
    return activeProducts.filter(p => {
      const price = getRolePrice(p, userRole);
      const matchesQuery = !q || matchProductSearch(p, q).isMatch;
      const matchesCat = selectedCatName === 'All' || (p.category && p.category.toLowerCase() === selectedCatName.toLowerCase());
      const matchesBrand = selectedBrandName === 'All' || (p.brandName && p.brandName.toLowerCase() === selectedBrandName.toLowerCase());
      let matchesPrice = true;
      if (priceFilter === 'under800') matchesPrice = price < 800;
      if (priceFilter === '800to1500') matchesPrice = price >= 800 && price <= 1500;
      if (priceFilter === 'above1500') matchesPrice = price > 1500;
      return matchesQuery && matchesCat && matchesBrand && matchesPrice;
    });
  }, [activeProducts, query, selectedCatName, selectedBrandName, priceFilter, userRole, getRolePrice]);

  // Customer Search Tracking:
  // Track EVERY product search performed by every user in the User App (found and not found).
  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < 2) return;

    const matchedList = (activeProducts || []).filter(p => matchProductSearch(p, trimmed).isMatch);
    const isFound = matchedList.length > 0;

    // Debounce to allow user to finish typing before saving
    const timer = setTimeout(() => {
      trackCustomerSearch({
        query: trimmed,
        matchedProducts: matchedList,
        isFound,
        user: userProfile
      });
    }, 1200);

    return () => clearTimeout(timer);
  }, [query, activeProducts, userProfile]);

  const activeFilterCount = [
    selectedCatName !== 'All',
    selectedBrandName !== 'All',
    priceFilter !== 'all'
  ].filter(Boolean).length;

  const handleReset = () => {
    setQuery('');
    setSelectedCatName('All');
    setSelectedBrandName('All');
    setPriceFilter('all');
  };

  return (
    <div className="pb-28 min-h-screen bg-[#FFF8FA] animate-fade-in">
      {/* ─────────── Search Header ─────────── */}
      <div className="sticky top-0 z-20 bg-white/97 backdrop-blur-md border-b border-[#FCE4EC] shadow-sm">
        {/* Search input row */}
        <div className="flex items-center gap-2 px-3 pt-3 pb-2">
          <button
            onClick={() => setCurrentScreen('home')}
            className="w-8 h-8 rounded-full bg-[#FFF8FA] border border-[#FCE4EC] flex items-center justify-center text-[#C2477A] shrink-0"
          >
            <ChevronLeft size={18} />
          </button>

          <div className="flex-1 bg-[#FFF8FA] rounded-2xl border border-[#FCE4EC] px-3 py-2.5 flex items-center gap-2 focus-within:border-[#C2477A] focus-within:shadow-sm transition-all">
            <Search size={15} className="text-[#C2477A] shrink-0" />
            <input
              ref={searchInputRef}
              type="text"
              autoFocus
              placeholder="Search products, brands, categories..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full bg-transparent text-xs text-[#3A2430] outline-none font-medium placeholder-[#B0909A]"
            />
            {query && (
              <button onClick={() => setQuery('')} className="text-gray-400 shrink-0">
                <X size={14} />
              </button>
            )}
          </div>

          {/* Filter toggle */}
          <button
            onClick={() => setShowFilters(f => !f)}
            className={`relative w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-all ${
              showFilters || activeFilterCount > 0
                ? 'bg-[#C2477A] text-white shadow-sm'
                : 'bg-[#FFF8FA] border border-[#FCE4EC] text-[#C2477A]'
            }`}
          >
            <SlidersHorizontal size={16} />
            {activeFilterCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-white text-[#C2477A] border border-[#C2477A] text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center">
                {activeFilterCount}
              </span>
            )}
          </button>
        </div>

        {/* Filter panels */}
        {showFilters && (
          <div className="px-3 pb-3 space-y-2 border-t border-[#FCE4EC]/60 pt-2">
            {/* Category pills */}
            <div>
              <div className="text-[10px] uppercase font-black text-[#8C7078] mb-1.5 tracking-wider">Category</div>
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-0.5">
                {['All', ...(categories || []).map(c => c.name)].map(name => (
                  <button
                    key={name}
                    onClick={() => setSelectedCatName(name)}
                    className={`px-3 py-1 rounded-full text-[11px] font-bold flex-shrink-0 transition-all ${
                      selectedCatName === name ? 'bg-[#C2477A] text-white' : 'bg-white text-[#8C7078] border border-[#FCE4EC]'
                    }`}
                  >
                    {name}
                  </button>
                ))}
              </div>
            </div>

            {/* Brand pills */}
            {activeBrands && activeBrands.length > 0 && (
              <div>
                <div className="text-[10px] uppercase font-black text-[#8C7078] mb-1.5 tracking-wider">Brand</div>
                <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-0.5">
                  {['All', ...activeBrands.map(b => b.name)].map(name => (
                    <button
                      key={name}
                      onClick={() => setSelectedBrandName(name)}
                      className={`px-3 py-1 rounded-full text-[11px] font-bold flex-shrink-0 transition-all ${
                        selectedBrandName === name ? 'bg-[#C2477A] text-white' : 'bg-white text-[#8C7078] border border-[#FCE4EC]'
                      }`}
                    >
                      {name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Price range */}
            <div>
              <div className="text-[10px] uppercase font-black text-[#8C7078] mb-1.5 tracking-wider">Price Range</div>
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
                {[
                  { id: 'all', label: 'All Prices' },
                  { id: 'under800', label: 'Under ₹800' },
                  { id: '800to1500', label: '₹800 – ₹1,500' },
                  { id: 'above1500', label: 'Above ₹1,500' }
                ].map(f => (
                  <button
                    key={f.id}
                    onClick={() => setPriceFilter(f.id)}
                    className={`px-3 py-1 rounded-full text-[11px] font-bold flex-shrink-0 transition-all ${
                      priceFilter === f.id ? 'bg-[#C2477A] text-white' : 'bg-white text-[#8C7078] border border-[#FCE4EC]'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            {activeFilterCount > 0 && (
              <button
                onClick={handleReset}
                className="text-[11px] text-[#C2477A] font-bold underline"
              >
                Clear all filters
              </button>
            )}
          </div>
        )}
      </div>

      {/* ─────────── Results ─────────── */}
      <div className="p-4">
        <div className="flex justify-between items-center mb-3">
          <span className="text-xs font-bold text-[#3A2430] uppercase tracking-wider">
            {query ? `Results for "${query}"` : 'All Products'} ({filteredProducts.length})
          </span>
          {(query || activeFilterCount > 0) && (
            <button
              onClick={handleReset}
              className="text-[11px] text-[#C2477A] font-bold underline"
            >
              Reset
            </button>
          )}
        </div>

        {filteredProducts.length === 0 ? (
          <div className="py-16 text-center flex flex-col items-center gap-3">
            <div className="w-16 h-16 rounded-full bg-[#FFF0F5] flex items-center justify-center text-[#C2477A]">
              <Search size={28} />
            </div>
            <p className="text-sm font-bold text-[#3A2430]">No products found</p>
            <p className="text-xs text-[#8C7078]">Try a different keyword or reset your filters.</p>
            <button
              onClick={handleReset}
              className="mt-1 px-5 py-2 bg-[#C2477A] text-white text-xs font-black rounded-full shadow-sm"
            >
              Clear Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {filteredProducts.map((product) => {
              const rolePrice = getRolePrice(product, userRole);
              const hasDiscount = userRole !== 'general' && rolePrice < product.mrp;
              const cartQty = cartQuantityMap.get(product.id) || 0;
              const fav = isFavorite(product.id);

              return (
                <div
                  key={product.id}
                  onClick={() => { setSelectedProduct(product); setCurrentScreen('product'); }}
                  className="bg-white rounded-2xl border border-[#FCE4EC] overflow-hidden shadow-sm hover:shadow-md transition-all cursor-pointer flex flex-col"
                >
                  {/* Image */}
                  <div className="relative aspect-square bg-[#FCE4EC]/30 overflow-hidden">
                    <img
                      src={product.image}
                      alt={product.name}
                      loading="lazy"
                      decoding="async"
                      className="w-full h-full object-cover transition-transform hover:scale-105 duration-300"
                    />
                    {hasDiscount && (
                      <span className="absolute top-2 left-2 bg-[#C2477A] text-white text-[9px] font-black px-2 py-0.5 rounded-full uppercase shadow-sm">
                        {Math.round(((product.mrp - rolePrice) / product.mrp) * 100)}% OFF
                      </span>
                    )}
                    {/* Favorite heart */}
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); toggleFavorite(product); }}
                      className={`absolute top-2 right-2 w-7 h-7 rounded-full flex items-center justify-center shadow-sm transition-all active:scale-90 ${
                        fav ? 'bg-[#C2477A]' : 'bg-white/95 hover:scale-110'
                      }`}
                      title={fav ? 'Remove from Wishlist' : 'Save to Wishlist'}
                    >
                      <Heart size={13} className={fav ? 'fill-white text-white' : 'text-[#C2477A]'} />
                    </button>
                    {/* Rating */}
                    {product.rating && (
                      <span className="absolute bottom-2 left-2 bg-white/90 text-[#3A2430] text-[9px] font-bold px-1.5 py-0.5 rounded flex items-center gap-0.5 shadow-sm">
                        <Star size={9} className="fill-[#F5A8C0] text-[#C2477A]" /> {product.rating}
                      </span>
                    )}
                  </div>

                  {/* Info */}
                  <div className="p-3 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="text-[10px] uppercase font-bold tracking-wider text-[#8C7078] mb-0.5">{product.brandName}</div>
                      <h4 className="text-xs font-semibold text-[#3A2430] line-clamp-2 leading-snug mb-2">{product.name}</h4>
                    </div>

                    <div className="flex items-center justify-between pt-1 border-t border-[#FCE4EC]/60">
                      <div>
                        {hasDiscount ? (
                          <div className="flex items-baseline gap-1">
                            <span className="text-sm font-bold text-[#C2477A]">₹{rolePrice}</span>
                            <span className="text-[10px] text-[#8C7078] line-through">₹{product.mrp}</span>
                          </div>
                        ) : (
                          <span className="text-sm font-bold text-[#3A2430]">₹{rolePrice || product.mrp}</span>
                        )}
                      </div>

                      {/* Cart stepper */}
                      {cartQty > 0 ? (
                        <div
                          onClick={(e) => e.stopPropagation()}
                          className="bg-[#C2477A] text-white rounded-full flex items-center gap-1 px-1.5 py-0.5 shadow-sm"
                        >
                          <button
                            onClick={(e) => { e.stopPropagation(); updateCartQuantity(product.id, cartQty - 1); }}
                            className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-xs font-bold"
                          >−</button>
                          <span className="text-xs font-black px-1 min-w-[14px] text-center">{cartQty}</span>
                          <button
                            onClick={(e) => { e.stopPropagation(); updateCartQuantity(product.id, cartQty + 1); }}
                            className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-xs font-bold"
                          >+</button>
                        </div>
                      ) : (
                        <button
                          onClick={(e) => { e.stopPropagation(); addToCart(product, 1); }}
                          className="w-7 h-7 rounded-full bg-[#FCE4EC] text-[#C2477A] hover:bg-[#C2477A] hover:text-white font-bold text-sm flex items-center justify-center transition-colors"
                        >+</button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
