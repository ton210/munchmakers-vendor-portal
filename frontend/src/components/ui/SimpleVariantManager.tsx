import React, { useState } from 'react';
import { PlusIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { Button } from './Button';

export interface SimpleVariant {
  id: string;
  name: string;
  price: number;
  moq: number;
}

interface SimpleVariantManagerProps {
  variants: SimpleVariant[];
  onVariantsChange: (variants: SimpleVariant[]) => void;
  basePrice: number;
  className?: string;
}

export const SimpleVariantManager: React.FC<SimpleVariantManagerProps> = ({
  variants,
  onVariantsChange,
  basePrice,
  className = ""
}) => {
  const [showVariants, setShowVariants] = useState(variants.length > 0);

  const addVariant = () => {
    const newVariant: SimpleVariant = {
      id: Date.now() + '-' + Math.random().toString(36).substr(2, 9),
      name: '',
      price: basePrice,
      moq: 1
    };
    onVariantsChange([...variants, newVariant]);
  };

  const updateVariant = (id: string, updates: Partial<SimpleVariant>) => {
    onVariantsChange(variants.map(variant =>
      variant.id === id ? { ...variant, ...updates } : variant
    ));
  };

  const removeVariant = (id: string) => {
    onVariantsChange(variants.filter(variant => variant.id !== id));
  };

  const addCommonVariants = (type: 'size' | 'color') => {
    const commonVariants = {
      size: [
        { name: 'Small', price: basePrice * 0.8 },
        { name: 'Medium', price: basePrice },
        { name: 'Large', price: basePrice * 1.2 }
      ],
      color: [
        { name: 'Black', price: basePrice },
        { name: 'Silver', price: basePrice },
        { name: 'Gold', price: basePrice * 1.1 }
      ]
    };

    const newVariants = commonVariants[type].map(v => ({
      id: Date.now() + '-' + Math.random().toString(36).substr(2, 9),
      name: v.name,
      price: v.price,
      moq: 1
    }));

    onVariantsChange([...variants, ...newVariants]);
  };

  if (!showVariants) {
    return (
      <div className={`space-y-4 ${className}`}>
        <div className="flex justify-between items-center">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Product Variants
            </label>
            <p className="text-sm text-gray-500">
              Add variants like size, color, or material options
            </p>
          </div>
          <Button onClick={() => setShowVariants(true)} variant="secondary" size="sm">
            Add Variants
          </Button>
        </div>

        <div className="text-center py-8 bg-gray-50 rounded-lg">
          <p className="text-gray-500 mb-4">No variants - selling single product type</p>
          <div className="flex flex-wrap justify-center gap-2">
            <button
              onClick={() => addCommonVariants('size')}
              className="px-3 py-2 text-sm bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200"
            >
              + Add Size Variants
            </button>
            <button
              onClick={() => addCommonVariants('color')}
              className="px-3 py-2 text-sm bg-green-100 text-green-700 rounded-lg hover:bg-green-200"
            >
              + Add Color Variants
            </button>
            <button
              onClick={addVariant}
              className="px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
            >
              + Custom Variant
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex justify-between items-center">
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Product Variants ({variants.length})
          </label>
          <p className="text-sm text-gray-500">
            Different versions of your product with individual pricing
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={addVariant} variant="secondary" size="sm">
            <PlusIcon className="h-4 w-4 mr-1" />
            Add Variant
          </Button>
        </div>
      </div>

      {variants.length === 0 ? (
        <div className="text-center py-6 bg-gray-50 rounded-lg">
          <div className="flex flex-wrap justify-center gap-2">
            <button
              onClick={() => addCommonVariants('size')}
              className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200"
            >
              + Size Options (S/M/L)
            </button>
            <button
              onClick={() => addCommonVariants('color')}
              className="px-4 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200"
            >
              + Color Options
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {variants.map((variant, index) => (
            <div key={variant.id} className="border border-gray-200 rounded-lg p-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Variant Name *
                  </label>
                  <input
                    type="text"
                    value={variant.name}
                    onChange={(e) => updateVariant(variant.id, { name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="e.g., Red, Large, Premium"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Price ($) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={variant.price}
                    onChange={(e) => updateVariant(variant.id, { price: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Min Order *
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={variant.moq}
                    onChange={(e) => updateVariant(variant.id, { moq: parseInt(e.target.value) || 1 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>

                <div className="flex justify-center">
                  <button
                    onClick={() => removeVariant(variant.id)}
                    className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded"
                    title="Remove variant"
                  >
                    <XMarkIcon className="h-5 w-5" />
                  </button>
                </div>
              </div>

              {/* Price difference indicator */}
              {variant.price !== basePrice && (
                <div className="mt-2 text-sm">
                  {variant.price > basePrice ? (
                    <span className="text-green-600">
                      +${(variant.price - basePrice).toFixed(2)} vs base price
                    </span>
                  ) : (
                    <span className="text-red-600">
                      -${(basePrice - variant.price).toFixed(2)} vs base price
                    </span>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Quick Actions */}
      {variants.length > 0 && (
        <div className="flex flex-wrap gap-2 pt-2">
          <button
            onClick={() => {
              variants.forEach(variant => {
                updateVariant(variant.id, { price: basePrice });
              });
            }}
            className="px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
          >
            Reset all to base price
          </button>
          <button
            onClick={() => {
              variants.forEach(variant => {
                updateVariant(variant.id, { moq: 1 });
              });
            }}
            className="px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
          >
            Set all MOQ to 1
          </button>
        </div>
      )}

      {/* Variants Summary */}
      {variants.length > 0 && (
        <div className="bg-blue-50 rounded-lg p-4">
          <h5 className="font-medium text-blue-900 mb-2">Variants Summary</h5>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-blue-800">
            {variants.map(variant => (
              <div key={variant.id} className="flex justify-between">
                <span>{variant.name || 'Unnamed'}:</span>
                <span>${variant.price.toFixed(2)} (MOQ: {variant.moq})</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};