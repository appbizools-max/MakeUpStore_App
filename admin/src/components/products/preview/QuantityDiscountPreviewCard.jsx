import React from 'react';
import { Percent, TrendingDown, Package } from 'lucide-react';

/**
 * QuantityDiscountPreviewCard - Shows quantity tier discounts in right sidebar
 */
const QuantityDiscountPreviewCard = ({ quantityTiers = {}, rolePricing = {} }) => {
  const roles = [
    { key: 'retail', label: 'Retail', color: 'blue' },
    { key: 'wholesaler', label: 'Wholesale', color: 'green' },
    { key: 'distributor', label: 'Distributor', color: 'purple' },
  ];

  const hasTiers = Object.keys(quantityTiers).length > 0;

  // Calculate discounted price based on tier
  const calculateDiscountedPrice = (basePrice, discountPercent) => {
    return basePrice * (1 - discountPercent / 100);
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-orange-50 to-amber-50 px-4 py-3 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <Percent className="w-5 h-5 text-orange-600" />
          <h3 className="font-semibold text-gray-800">Quantity Discounts</h3>
        </div>
      </div>

      {/* Discounts Breakdown */}
      <div className="p-4">
        {!hasTiers ? (
          <div className="text-center py-6 text-gray-400">
            <Percent className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No quantity tiers configured</p>
            <p className="text-xs mt-1">Set discounts in Step ⑤</p>
          </div>
        ) : (
          <div className="space-y-4">
            {roles.map(({ key, label, color }) => {
              const tiers = quantityTiers[key];
              const basePrice = rolePricing[key];

              if (!tiers || tiers.length === 0 || !basePrice) return null;

              const colorClasses = {
                blue: 'border-blue-200 bg-blue-50',
                green: 'border-green-200 bg-green-50',
                purple: 'border-purple-200 bg-purple-50',
              };

              const textColorClasses = {
                blue: 'text-blue-900',
                green: 'text-green-900',
                purple: 'text-purple-900',
              };

              return (
                <div key={key} className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Package className={`w-4 h-4 ${textColorClasses[color]}`} />
                    <h4 className={`text-sm font-semibold ${textColorClasses[color]}`}>
                      {label}
                    </h4>
                  </div>

                  <div className="space-y-2">
                    {tiers.map((tier, index) => {
                      const discountedPrice = calculateDiscountedPrice(basePrice, tier.discount);
                      const savings = basePrice - discountedPrice;

                      return (
                        <div
                          key={index}
                          className={`p-2.5 rounded-lg border ${colorClasses[color]}`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-medium text-gray-700">
                              {tier.minQty}+ units
                            </span>
                            <div className="flex items-center gap-1.5">
                              <TrendingDown className="w-3 h-3 text-orange-600" />
                              <span className="text-sm font-bold text-orange-600">
                                {tier.discount}% OFF
                              </span>
                            </div>
                          </div>
                          <div className="flex items-baseline justify-between">
                            <div className="flex items-baseline gap-2">
                              <span className="text-base font-bold text-gray-900">
                                ₹{discountedPrice.toFixed(2)}
                              </span>
                              <span className="text-xs text-gray-500 line-through">
                                ₹{basePrice.toFixed(2)}
                              </span>
                            </div>
                            <span className="text-xs text-green-600 font-medium">
                              Save ₹{savings.toFixed(2)}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}

            {/* Summary */}
            <div className="pt-3 border-t border-gray-200 mt-3">
              <div className="flex items-center gap-2 text-xs text-gray-600">
                <TrendingDown className="w-4 h-4 text-green-600" />
                <span>
                  {Object.values(quantityTiers).flat().length} active discount tiers
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default QuantityDiscountPreviewCard;
