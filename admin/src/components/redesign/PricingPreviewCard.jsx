import React from 'react';
import { DollarSign, Users, TrendingUp } from 'lucide-react';

/**
 * PricingPreviewCard - Shows role-based pricing breakdown in right sidebar
 */
const PricingPreviewCard = ({ rolePricing = {} }) => {
  const roles = [
    { key: 'retail', label: 'Retail Customer', icon: Users, color: 'blue' },
    { key: 'wholesaler', label: 'Wholesaler', icon: TrendingUp, color: 'green' },
    { key: 'distributor', label: 'Distributor', icon: TrendingUp, color: 'purple' },
  ];

  const hasRolePricing = Object.keys(rolePricing).length > 0;

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 px-4 py-3 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <DollarSign className="w-5 h-5 text-green-600" />
          <h3 className="font-semibold text-gray-800">Role-Based Pricing</h3>
        </div>
      </div>

      {/* Pricing Breakdown */}
      <div className="p-4">
        {!hasRolePricing ? (
          <div className="text-center py-6 text-gray-400">
            <DollarSign className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No role pricing configured</p>
            <p className="text-xs mt-1">Set prices in Step ④</p>
          </div>
        ) : (
          <div className="space-y-3">
            {roles.map(({ key, label, icon: Icon, color }) => {
              const price = rolePricing[key];
              
              if (!price || price <= 0) return null;

              const colorClasses = {
                blue: 'bg-blue-50 text-blue-700 border-blue-200',
                green: 'bg-green-50 text-green-700 border-green-200',
                purple: 'bg-purple-50 text-purple-700 border-purple-200',
              };

              return (
                <div
                  key={key}
                  className={`p-3 rounded-lg border ${colorClasses[color]}`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Icon className="w-4 h-4" />
                      <span className="text-sm font-medium">{label}</span>
                    </div>
                    <span className="text-lg font-bold">
                      ₹{price.toFixed(2)}
                    </span>
                  </div>
                </div>
              );
            })}

            {/* Margin Indicators */}
            {rolePricing.retail && rolePricing.wholesaler && (
              <div className="pt-3 border-t border-gray-200 mt-3">
                <p className="text-xs font-medium text-gray-600 mb-2">Margin Analysis</p>
                <div className="space-y-1 text-xs">
                  {rolePricing.wholesaler && (
                    <div className="flex justify-between text-gray-700">
                      <span>Retail → Wholesale:</span>
                      <span className="font-medium">
                        {((rolePricing.retail - rolePricing.wholesaler) / rolePricing.retail * 100).toFixed(1)}%
                      </span>
                    </div>
                  )}
                  {rolePricing.distributor && rolePricing.wholesaler && (
                    <div className="flex justify-between text-gray-700">
                      <span>Wholesale → Distributor:</span>
                      <span className="font-medium">
                        {((rolePricing.wholesaler - rolePricing.distributor) / rolePricing.wholesaler * 100).toFixed(1)}%
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default PricingPreviewCard;
