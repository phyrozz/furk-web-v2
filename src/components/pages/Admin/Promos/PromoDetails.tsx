import React from 'react';
import { Promo } from '../../../../models/promo';

interface PromoDetailsProps {
  promo: Promo;
}

const PromoDetails: React.FC<PromoDetailsProps> = ({ promo }) => {
  const getDiscountBadgeColor = (type: string) => {
    switch (type) {
      case 'percent':
        return 'bg-blue-100 text-blue-800';
      case 'fixed':
        return 'bg-green-100 text-green-800';
      case 'credits':
        return 'bg-purple-100 text-purple-800';
      case 'points':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getDiscountLabel = (type: string) => {
    switch (type) {
      case 'percent':
        return `${promo.discount_value}%`;
      case 'fixed':
        return `${promo.discount_value} Furkredits`;
      case 'credits':
        return `+${promo.discount_value} Furkredits`;
      case 'points':
        return `${promo.discount_value} Furkoins`;
      default:
        return promo.discount_value;
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6 select-none">
      <h2 className="text-2xl font-bold text-gray-900 mb-4">Promo Details</h2>
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4 select-text cursor-default">
          <div>
            <p className="text-sm text-gray-500">Code</p>
            <p className="text-gray-900">{promo.code}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Description</p>
            <p className="text-gray-900">{promo.description}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Discount</p>
            <div className="flex items-center gap-2">
              <span className={`px-2.5 py-0.5 rounded-full text-sm font-medium ${getDiscountBadgeColor(promo.discount_type)}`}>
                {getDiscountLabel(promo.discount_type)}
              </span>
            </div>
          </div>
          <div>
            <p className="text-sm text-gray-500">Usage</p>
            <p className="text-gray-900">{promo.used_count}/{promo.usage_limit}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Per User Limit</p>
            <p className="text-gray-900">{promo.per_user_limit}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Scope</p>
            <p className="text-gray-900">{promo.scope}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Created At</p>
            <p className="text-gray-900">{new Date(promo.created_at).toLocaleDateString()}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Start Date</p>
            <p className="text-gray-900">{new Date(promo.start_date).toLocaleDateString()}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">End Date (Expires)</p>
            <p className="text-gray-900">{new Date(promo.end_date).toLocaleDateString()}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PromoDetails;