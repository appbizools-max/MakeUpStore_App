import React from 'react';
import { Star, TrendingUp, Sparkles, Flag, Eye } from 'lucide-react';

/**
 * MerchandisingPreviewCard - Shows merchandising flags and visibility in right sidebar
 */
const MerchandisingPreviewCard = ({ merchandising = {} }) => {
  const {
    isNew = false,
    isFeatured = false,
    isTrending = false,
    isRecommended = false,
    isActive = true,
  } = merchandising;

  const badges = [
    {
      key: 'isNew',
      label: 'New Arrival',
      icon: Sparkles,
      color: 'bg-blue-500',
      active: isNew,
    },
    {
      key: 'isFeatured',
      label: 'Featured',
      icon: Star,
      color: 'bg-yellow-500',
      active: isFeatured,
    },
    {
      key: 'isTrending',
      label: 'Trending',
      icon: TrendingUp,
      color: 'bg-pink-500',
      active: isTrending,
    },
    {
      key: 'isRecommended',
      label: 'Recommended',
      icon: Flag,
      color: 'bg-purple-500',
      active: isRecommended,
    },
  ];

  const activeBadges = badges.filter(b => b.active);
  const hasMerchandising = activeBadges.length > 0;

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-50 to-blue-50 px-4 py-3 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <Star className="w-5 h-5 text-indigo-600" />
          <h3 className="font-semibold text-gray-800">Merchandising</h3>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-4">
        {/* Visibility Status */}
        <div className={`p-3 rounded-lg border-2 ${
          isActive 
            ? 'bg-green-50 border-green-300' 
            : 'bg-gray-50 border-gray-300'
        }`}>
          <div className="flex items-center gap-2">
            <Eye className={`w-5 h-5 ${isActive ? 'text-green-600' : 'text-gray-400'}`} />
            <div>
              <p className={`text-sm font-semibold ${
                isActive ? 'text-green-900' : 'text-gray-600'
              }`}>
                {isActive ? 'Product Visible' : 'Product Hidden'}
              </p>
              <p className="text-xs text-gray-600 mt-0.5">
                {isActive 
                  ? 'Customers can see this product' 
                  : 'Hidden from customer view'
                }
              </p>
            </div>
          </div>
        </div>

        {/* Active Badges */}
        {!hasMerchandising ? (
          <div className="text-center py-4 text-gray-400">
            <Star className="w-10 h-10 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No merchandising badges</p>
            <p className="text-xs mt-1">Configure in Step ⑦</p>
          </div>
        ) : (
          <div>
            <p className="text-xs font-medium text-gray-600 mb-3">Active Badges</p>
            <div className="grid grid-cols-2 gap-2">
              {activeBadges.map(({ key, label, icon: Icon, color }) => (
                <div
                  key={key}
                  className={`${color} text-white p-3 rounded-lg shadow-sm`}
                >
                  <Icon className="w-5 h-5 mb-1.5" />
                  <p className="text-xs font-semibold leading-tight">{label}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* All Badges Preview */}
        <div className="pt-3 border-t border-gray-200">
          <p className="text-xs font-medium text-gray-600 mb-2">Badge Preview</p>
          <div className="flex flex-wrap gap-1.5">
            {badges.map(({ key, label, active, color }) => (
              <span
                key={key}
                className={`px-2 py-1 rounded-full text-xs font-medium ${
                  active
                    ? `${color} text-white shadow-sm`
                    : 'bg-gray-100 text-gray-400'
                }`}
              >
                {label}
              </span>
            ))}
          </div>
        </div>

        {/* Summary */}
        {hasMerchandising && (
          <div className="pt-3 border-t border-gray-200">
            <div className="flex items-center gap-2 text-xs text-gray-600">
              <Star className="w-4 h-4 text-yellow-500" />
              <span>
                {activeBadges.length} merchandising {activeBadges.length === 1 ? 'badge' : 'badges'} active
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MerchandisingPreviewCard;
