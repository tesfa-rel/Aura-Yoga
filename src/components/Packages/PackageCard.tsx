import React from 'react';
import { format } from 'date-fns';

interface Package {
  id: string;
  name: string;
  description?: string;
  sessionsCount: number;
  price: number;
  validityDays?: number;
  classType?: string;
  isActive: boolean;
}

interface UserPackage {
  id: string;
  remainingSessions: number;
  expiresAt?: string;
  createdAt: string;
  package: Package;
}

interface PackageCardProps {
  package: Package;
  userPackage?: UserPackage;
  onPurchase?: (packageId: string) => void;
  loading?: boolean;
}

const PackageCard: React.FC<PackageCardProps> = ({ 
  package: pkg, 
  userPackage, 
  onPurchase, 
  loading = false 
}) => {
  const isExpired = userPackage && userPackage.expiresAt 
    ? new Date(userPackage.expiresAt) < new Date() 
    : false;

  const getPackageTypeColor = () => {
    if (userPackage) {
      if (isExpired) return 'bg-aura-sand/20 text-aura-bark';
      if (userPackage.remainingSessions === 0) return 'bg-yellow-100 text-yellow-800';
      return 'bg-green-100 text-green-800';
    }
    return 'bg-aura-sand/20 text-aura-bark';
  };

  const getPackageTypeText = () => {
    if (userPackage) {
      if (isExpired) return 'Expired';
      if (userPackage.remainingSessions === 0) return 'Used Up';
      return 'Active';
    }
    return 'Available';
  };

  const handlePurchaseClick = () => {
    if (onPurchase && !userPackage) {
      onPurchase(pkg.id);
    }
  };

  return (
    <div className="bg-aura-ivory rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow duration-200 border border-aura-sand/20">
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="text-lg font-semibold text-aura-bark">{pkg.name}</h3>
            {pkg.classType && pkg.classType !== 'ALL' && (
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-aura-sand/20 text-aura-bark">
                {pkg.classType}
              </span>
            )}
          </div>
          {pkg.description && (
            <p className="text-aura-umber text-sm mb-2">{pkg.description}</p>
          )}
        </div>
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPackageTypeColor()}`}>
          {getPackageTypeText()}
        </span>
      </div>

      <div className="space-y-2 mb-4">
        <div className="flex items-center justify-between">
          <span className="text-sm text-aura-umber">Sessions:</span>
          <span className="text-sm font-medium text-aura-bark">
            {userPackage ? `${userPackage.remainingSessions} / ${pkg.sessionsCount}` : pkg.sessionsCount}
          </span>
        </div>
        
        {pkg.validityDays && (
          <div className="flex items-center justify-between">
            <span className="text-sm text-aura-umber">Validity:</span>
            <span className="text-sm font-medium text-aura-bark">
              {pkg.validityDays} days
            </span>
          </div>
        )}
        
        {userPackage && userPackage.expiresAt && (
          <div className="flex items-center justify-between">
            <span className="text-sm text-aura-umber">Expires:</span>
            <span className={`text-sm font-medium ${isExpired ? 'text-red-600' : 'text-aura-bark'}`}>
              {format(new Date(userPackage.expiresAt), 'MMM dd, yyyy')}
            </span>
          </div>
        )}
      </div>

      <div className="border-t pt-4">
        <div className="flex items-center justify-between mb-4">
          <span className="text-2xl font-bold text-aura-bark">
            ETB {pkg.price.toLocaleString()}
          </span>
          {pkg.sessionsCount > 1 && (
            <span className="text-sm text-aura-umber">
              ETB {(pkg.price / pkg.sessionsCount).toFixed(0)} per session
            </span>
          )}
        </div>

        {!userPackage ? (
          <button
            onClick={handlePurchaseClick}
            disabled={loading || !pkg.isActive}
            className={`w-full px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${
              !pkg.isActive
                ? 'bg-aura-sand/30 text-aura-clay cursor-not-allowed'
                : loading
                ? 'bg-aura-bark text-aura-ivory cursor-wait'
                : 'bg-aura-bark text-aura-ivory hover:bg-aura-umber focus:outline-none focus:ring-2 focus:ring-aura-umber focus:ring-offset-2'
            }`}
          >
            {loading ? 'Processing...' : pkg.isActive ? 'Purchase Package' : 'Not Available'}
          </button>
        ) : (
          <div className="space-y-2">
            <div className="w-full bg-aura-sand/20 rounded-full h-2">
              <div
                className={`h-2 rounded-full ${isExpired ? 'bg-aura-clay' : userPackage.remainingSessions === 0 ? 'bg-yellow-400' : 'bg-green-400'}`}
                style={{ width: `${Math.max((userPackage.remainingSessions / pkg.sessionsCount) * 100, 5)}%` }}
              ></div>
            </div>
            <p className="text-xs text-aura-umber text-center">
              {userPackage.remainingSessions} sessions remaining
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PackageCard;
