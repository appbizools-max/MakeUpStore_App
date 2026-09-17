import React from 'react';
import { useApp } from '../context/AppContext.jsx';
import { ChevronLeft, Star, Store } from 'lucide-react';

export const BrandScreen = () => {
  const {
    selectedBrand,
    setSelectedBrand,
    activeBrands,
    activeProducts,
    userRole,
    getRolePrice,
    setSelectedProduct,
    setCurrentScreen,
    addToCart
  } = useApp();

  React.useEffect(() => {
    if (selectedBrand && !selectedBrand.enabled) {
      setSelectedBrand(null);
    }
  }, [selectedBrand, activeBrands]);

  const brandProducts = (selectedBrand && selectedBrand.enabled)
    ? activeProducts.filter(p => p.brandId === selectedBrand.id || p.brandName.toLowerCase() === selectedBrand.name.toLowerCase())
    : activeProducts;

  return (
    <div className="pb-28 min-h-screen bg-[#FFF8FA] animate-fade-in">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-white/95 backdrop-blur-md px-4 py-3 border-b border-[#FCE4EC] flex items-center justify-between">
        <button
          onClick={() => setCurrentScreen('home')}
          className="flex items-center gap-1 text-xs font-bold text-[#C2477A]"
        >
          <ChevronLeft size={18} /> Home
        </button>
        <h1 className="text-sm font-extrabold text-[#3A2430] uppercase tracking-wider flex items-center gap-1.5">
          <Store size={16} className="text-[#C2477A]" />
          <span>{selectedBrand ? selectedBrand.name : 'Brand Directory'}</span>
        </h1>
        <div className="w-6" />
      </div>

      {/* Brand Horizontal Scroll Switcher */}
      <div className="p-4 border-b border-[#FCE4EC] bg-white">
        <div className="text-[11px] font-bold text-[#8C7078] uppercase mb-2">Partner Brands</div>
        <div className="flex overflow-x-auto gap-2 no-scrollbar">
          <button
            onClick={() => setSelectedBrand(null)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex-shrink-0 transition-all ${
              selectedBrand === null ? 'bg-[#C2477A] text-white' : 'bg-[#FFF8FA] text-[#3A2430] border border-[#FCE4EC]'
            }`}
          >
            All Brands
          </button>
          {activeBrands.map(b => (
            <button
              key={b.id}
              onClick={() => setSelectedBrand(b)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex-shrink-0 flex items-center gap-1.5 transition-all ${
                selectedBrand?.id === b.id ? 'bg-[#C2477A] text-white' : 'bg-[#FFF8FA] text-[#3A2430] border border-[#FCE4EC]'
              }`}
            >
              <span>{b.logo}</span>
              <span>{b.name}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="p-4">
        <div className="text-xs text-[#8C7078] mb-3 font-semibold">
          Showing {brandProducts.length} items {selectedBrand ? `for ${selectedBrand.name}` : 'in Directory'}
        </div>

        {brandProducts.length === 0 ? (
          <div className="p-8 text-center bg-white rounded-2xl border border-[#FCE4EC]">
            <p className="text-xs text-[#8C7078]">No products currently available for this brand.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {brandProducts.map((product) => {
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
