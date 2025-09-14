import React from 'react';
import { PlusIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { Button } from './Button';

export interface PricingTier {
  id: string;
  minQuantity: number;
  maxQuantity?: number;
  unitPrice: number;
}

interface PricingTiersProps {
  tiers: PricingTier[];
  onTiersChange: (tiers: PricingTier[]) => void;
  basePrice: number;
  className?: string;
}

export const PricingTiers: React.FC<PricingTiersProps> = ({
  tiers,
  onTiersChange,
  basePrice,
  className = ""
}) => {
  const addTier = () => {
    const lastTier = tiers[tiers.length - 1];
    const newMinQuantity = lastTier ? (lastTier.maxQuantity || lastTier.minQuantity) + 1 : 1;

    const newTier: PricingTier = {
      id: Date.now() + '-' + Math.random().toString(36).substr(2, 9),
      minQuantity: newMinQuantity,
      unitPrice: basePrice
    };

    onTiersChange([...tiers, newTier]);
  };

  const updateTier = (id: string, updates: Partial<PricingTier>) => {
    onTiersChange(tiers.map(tier =>
      tier.id === id ? { ...tier, ...updates } : tier
    ));
  };

  const removeTier = (id: string) => {
    onTiersChange(tiers.filter(tier => tier.id !== id));
  };

  const sortedTiers = [...tiers].sort((a, b) => a.minQuantity - b.minQuantity);

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex justify-between items-center">
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Tiered Pricing
          </label>
          <p className="text-sm text-gray-500">
            Set different prices based on order quantity
          </p>
        </div>
        <Button onClick={addTier} variant="secondary" size="sm">
          <PlusIcon className="h-4 w-4 mr-1" />
          Add Tier
        </Button>
      </div>

      {sortedTiers.length === 0 ? (
        <div className="text-center py-8 bg-gray-50 rounded-lg">
          <p className="text-gray-500 mb-4">No pricing tiers set</p>
          <p className="text-sm text-gray-400 mb-4">
            Base price of ${basePrice.toFixed(2)} will apply to all quantities
          </p>
          <Button onClick={addTier} variant="secondary">
            <PlusIcon className="h-4 w-4 mr-2" />
            Add First Tier
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {/* Base Price Display */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <div className="flex justify-between items-center">
              <div>
                <span className="text-sm font-medium text-blue-900">Base Price</span>
                <p className="text-xs text-blue-700">For quantities below tier minimums</p>
              </div>
              <span className="text-lg font-bold text-blue-900">${basePrice.toFixed(2)}</span>
            </div>
          </div>

          {sortedTiers.map((tier, index) => (
            <div key={tier.id} className="border border-gray-200 rounded-lg p-4">
              <div className="flex justify-between items-start mb-3">
                <h4 className="font-medium text-gray-900">Tier {index + 1}</h4>
                <button
                  onClick={() => removeTier(tier.id)}
                  className="text-red-500 hover:text-red-700"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Min Quantity *
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={tier.minQuantity}
                    onChange={(e) => updateTier(tier.id, {
                      minQuantity: parseInt(e.target.value) || 1
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Max Quantity
                  </label>
                  <input
                    type="number"
                    min={tier.minQuantity}
                    value={tier.maxQuantity || ''}
                    onChange={(e) => updateTier(tier.id, {
                      maxQuantity: e.target.value ? parseInt(e.target.value) : undefined
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="No limit"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Unit Price ($) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={tier.unitPrice}
                    onChange={(e) => updateTier(tier.id, {
                      unitPrice: parseFloat(e.target.value) || 0
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="mt-2 text-sm text-gray-600">
                {tier.maxQuantity ? (
                  <>Orders from {tier.minQuantity} to {tier.maxQuantity} units: ${tier.unitPrice.toFixed(2)} each</>
                ) : (
                  <>Orders of {tier.minQuantity}+ units: ${tier.unitPrice.toFixed(2)} each</>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pricing Summary */}
      {sortedTiers.length > 0 && (
        <div className="bg-gray-50 rounded-lg p-4">
          <h5 className="font-medium text-gray-900 mb-2">Pricing Summary</h5>
          <div className="space-y-1 text-sm text-gray-600">
            <div>1-{Math.min(...sortedTiers.map(t => t.minQuantity)) - 1}: ${basePrice.toFixed(2)} each</div>
            {sortedTiers.map((tier, index) => (
              <div key={tier.id}>
                {tier.maxQuantity ? (
                  <>{tier.minQuantity}-{tier.maxQuantity}: ${tier.unitPrice.toFixed(2)} each</>
                ) : (
                  <>{tier.minQuantity}+: ${tier.unitPrice.toFixed(2)} each</>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};