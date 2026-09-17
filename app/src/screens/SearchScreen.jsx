import React, { useState } from 'react';
import { useApp } from '../context/AppContext.jsx';
import { Search, ChevronLeft, Star, Filter, X } from 'lucide-react';

export const SearchScreen = () => {
  const {
    activeProducts,
    activeBrands,
    categories,
    userRole,
    getRolePrice,
    setSelectedProduct,
    setCurrentScreen,
    addToCart
  } = useApp();

  const [query, setQuery] = useState('');
  const [selectedCatName, setSelectedCatName] = useState('All');
  const [selectedBrandName, setSelectedBrandName] = useState('All');
  const [priceFilter, setPriceFilter] = useState('all'); // 'all' | 'under800' | '800to1500' | 'above1500'

  const filteredProducts = activeProducts.filter(p => {
    const price = getRolePrice(p, userRole);
    const matchesQuery = query === '' || p.name.toLowerCase().includes(query.toLowerCase()) || p.brandName.toLowerCase().includes(query.toLowerCase()) || p.category.toLowerCase().includes(query.toLowerCase());
    const matchesCat = selectedCatName === 'All' || p.category.toLowerCase() === selectedCatName.toLowerCase();
    const matchesBrand = selectedBrandName === 'All' || p.brandName.toLowerCase() === selectedBrandName.toLowerCase();

    let matchesPrice = true;
    if (priceFilter === 'under800') matchesPrice = price < 800;
    if (priceFilter === '800to1500') matchesPrice = price >= 800 && price <= 1500;
    if (priceFilter === 'above1500') matchesPrice = price > 1500;

    return matchesQuery && matchesCat && matchesBrand && matchesPrice;
  });

  return (
    <div className="pb-28 min-h-screen bg-[#FFF8FA] animate-fade-in">
      {/* Search Header */}
      <div className="sticky top-0 z-20 bg-white/95 backdrop-blur-md px-4 py-3 border-b border-[#FCE4EC]">
        <div className="flex items-center gap-2">
          <button onClick={() => setCurrentScreen('home')} className="text-[#C2477A] p-1">
            <ChevronLeft size={20} />
          </button>
          <div className="flex-1 bg-[#FFF8FA] rounded-xl border border-[#FCE4EC] px-3 py-2 flex items-center gap-2 focus-within:border-[#C2477A]">
            <Search size={16} className="text-[#C2477A]" />
            <input
              type="text"
              autoFocus
              placeholder="Search lipstick, serum, Lakmé, MAC..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full bg-transparent text-xs text-[#3A2430] outline-none font-medium placeholder-[#8C7078]"
            />
            {query && (
              <button onClick={() => setQuery('')} className="text-gray-400">
                <X size={14} />
              </button>
            )}
          </div>
        </div>

        {/* Filter Pills */}
        <div className="mt-3 space-y-2 text-xs">
          {/* Categories Horizontal Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
            <span className="text-[10px] uppercase font-bold text-[#8C7078] flex-shrink-0">Cat:</span>
            <button
              onClick={() => setSelectedCatName('All')}
              className={`px-3 py-1 rounded-full text-[11px] font-bold flex-shrink-0 transition-all ${
                selectedCatName === 'All' ? 'bg-[#C2477A] text-white' : 'bg-white text-[#8C7078] border border-[#FCE4EC]'
              }`}
            >
              All
            </button>
            {categories.map((c) => (
              <button
                key={c.id}
                onClick={() => setSelectedCatName(c.name)}
                className={`px-3 py-1 rounded-full text-[11px] font-bold flex-shrink-0 transition-all ${
                  selectedCatName === c.name ? 'bg-[#C2477A] text-white' : 'bg-white text-[#8C7078] border border-[#FCE4EC]'
                }`}
              >
                {c.name}
              </button>
            ))}
          </div>

          {/* Price Range Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            <span className="text-[10px] uppercase font-bold text-[#8C7078] flex-shrink-0">Price:</span>
            {[
              { id: 'all', label: 'All Prices' },
              { id: 'under800', label: 'Under ₹800' },
              { id: '800to1500', label: '₹800 - ₹1,500' },
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
      </div>

      {/* Results */}
      <div className="p-4">
        <div className="flex justify-between items-center mb-3">
          <span className="text-xs font-bold text-[#3A2430] uppercase tracking-wider">
            Search Results ({filteredProducts.length})
          </span>
          {(query || selectedCatName !== 'All' || priceFilter !== 'all') && (
            <button
              onClick={() => { setQuery(''); setSelectedCatName('All'); setPriceFilter('all'); }}
              className="text-[11px] text-[#C2477A] font-bold underline"
            >
              Reset Filters
            </button>
          )}
        </div>

        {filteredProducts.length === 0 ? (
          <div className="p-8 text-center bg-white rounded-2xl border border-[#FCE4EC] my-4">
            <p className="text-xs text-[#8C7078] font-medium">No matching products found.</p>
            <p className="text-[11px] text-gray-400 mt-1">Try adjusting your query or resetting filters.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {filteredProducts.map((product) => {
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
        )}
      </div>
    </div>
  );
};
