import React, { useState } from 'react';
import { PlusIcon, MinusIcon } from '@heroicons/react/24/outline';
import { Button } from './Button';

interface QuickPricingTier {
  minQuantity: number;
  price: number;
  label: string;
}

interface QuickPricingSetupProps {
  basePrice: number;
  onPricingChange: (tiers: any[]) => void;
  className?: string;
}

export const QuickPricingSetup: React.FC<QuickPricingSetupProps> = ({
  basePrice,
  onPricingChange,
  className = ""
}) => {
  const [quickTiers, setQuickTiers] = useState<QuickPricingTier[]>([
    { minQuantity: 1, price: basePrice, label: '1-9 units' },
    { minQuantity: 10, price: basePrice * 0.9, label: '10-49 units (10% off)' },
    { minQuantity: 50, price: basePrice * 0.8, label: '50+ units (20% off)' }
  ]);

  const [useQuickSetup, setUseQuickSetup] = useState(true);

  const updateQuickTier = (index: number, field: keyof QuickPricingTier, value: number | string) => {
    const newTiers = [...quickTiers];
    newTiers[index] = { ...newTiers[index], [field]: value };
    setQuickTiers(newTiers);

    // Convert to pricing tiers format
    const pricingTiers = newTiers.slice(1).map((tier, i) => ({
      id: `quick-${i}`,
      minQuantity: tier.minQuantity,
      maxQuantity: i < newTiers.length - 2 ? newTiers[i + 2].minQuantity - 1 : undefined,
      unitPrice: tier.price
    }));

    onPricingChange(pricingTiers);
  };

  const addTier = () => {
    const lastTier = quickTiers[quickTiers.length - 1];
    const newTier = {
      minQuantity: lastTier.minQuantity + 50,
      price: lastTier.price * 0.9,
      label: `${lastTier.minQuantity + 50}+ units`
    };

    setQuickTiers([...quickTiers, newTier]);
  };

  const removeTier = (index: number) => {
    if (quickTiers.length > 2) {
      setQuickTiers(quickTiers.filter((_, i) => i !== index));
    }
  };

  const applyDiscountPreset = (discount: number) => {
    const newTiers = quickTiers.map((tier, index) => ({
      ...tier,
      price: index === 0 ? basePrice : basePrice * (1 - (discount * index / 100))
    }));
    setQuickTiers(newTiers);
  };

  if (!useQuickSetup) {
    return (
      <div className={`space-y-4 ${className}`}>
        <div className="flex justify-between items-center">
          <label className="block text-sm font-medium text-gray-700">
            Pricing Setup
          </label>
          <Button
            onClick={() => setUseQuickSetup(true)}
            variant="secondary"
            size="sm"
          >
            Use Quick Setup
          </Button>
        </div>
        <div className="text-center py-8 bg-gray-50 rounded-lg">
          <p className="text-gray-500">Advanced pricing configuration would go here</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      <div className="flex justify-between items-center">
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Quick Pricing Setup
          </label>
          <p className="text-sm text-gray-500">
            Set volume discounts easily
          </p>
        </div>
        <Button
          onClick={() => setUseQuickSetup(false)}
          variant="secondary"
          size="sm"
        >
          Advanced Setup
        </Button>
      </div>

      {/* Discount Presets */}
      <div className="flex flex-wrap gap-2">
        <span className="text-sm text-gray-600">Quick presets:</span>
        {[5, 10, 15, 20].map(discount => (
          <button
            key={discount}
            onClick={() => applyDiscountPreset(discount)}
            className="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded-full hover:bg-blue-200"
          >
            {discount}% volume discount
          </button>
        ))}
      </div>

      {/* Pricing Tiers */}
      <div className="space-y-3">
        {quickTiers.map((tier, index) => (
          <div key={index} className="flex items-center gap-4 p-4 border border-gray-200 rounded-lg">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {tier.label}
              </label>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">$</span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={tier.price}
                  onChange={(e) => updateQuickTier(index, 'price', parseFloat(e.target.value) || 0)}
                  className="w-24 px-2 py-1 border border-gray-300 rounded text-sm focus:ring-primary-500 focus:border-primary-500"
                />
                <span className="text-sm text-gray-600">each</span>
              </div>
            </div>

            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Min Quantity
              </label>
              <input
                type="number"
                min="1"
                value={tier.minQuantity}
                onChange={(e) => updateQuickTier(index, 'minQuantity', parseInt(e.target.value) || 1)}
                className="w-20 px-2 py-1 border border-gray-300 rounded text-sm focus:ring-primary-500 focus:border-primary-500"
                disabled={index === 0}
              />
            </div>

            <div className="flex items-center gap-2">
              {index > 1 && (
                <button
                  onClick={() => removeTier(index)}
                  className="p-1 text-red-500 hover:text-red-700"
                  title="Remove tier"
                >
                  <MinusIcon className="h-4 w-4" />
                </button>
              )}
              {index === quickTiers.length - 1 && (
                <button
                  onClick={addTier}
                  className="p-1 text-green-500 hover:text-green-700"
                  title="Add tier"
                >
                  <PlusIcon className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Pricing Preview */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h5 className="font-medium text-gray-900 mb-2">Pricing Preview</h5>
        <div className="space-y-1 text-sm">
          {quickTiers.map((tier, index) => {
            const nextTier = quickTiers[index + 1];
            const range = nextTier
              ? `${tier.minQuantity}-${nextTier.minQuantity - 1}`
              : `${tier.minQuantity}+`;

            return (
              <div key={index} className="flex justify-between">
                <span className="text-gray-600">{range} units:</span>
                <span className="font-medium">${tier.price.toFixed(2)} each</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};