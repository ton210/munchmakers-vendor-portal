import React, { useState } from 'react';
import { PlusIcon, XMarkIcon, PhotoIcon } from '@heroicons/react/24/outline';
import { Button } from './Button';
import { ImageUpload, ImageFile } from './ImageUpload';

export interface ProductVariant {
  id: string;
  name: string;
  sku?: string;
  additionalPrice: number;
  moq: number;
  images: ImageFile[];
  attributes: { [key: string]: string };
}

interface VariantManagerProps {
  variants: ProductVariant[];
  onVariantsChange: (variants: ProductVariant[]) => void;
  className?: string;
}

export const VariantManager: React.FC<VariantManagerProps> = ({
  variants,
  onVariantsChange,
  className = ""
}) => {
  const [expandedVariant, setExpandedVariant] = useState<string | null>(null);

  const addVariant = () => {
    const newVariant: ProductVariant = {
      id: Date.now() + '-' + Math.random().toString(36).substr(2, 9),
      name: '',
      additionalPrice: 0,
      moq: 1,
      images: [],
      attributes: {}
    };
    onVariantsChange([...variants, newVariant]);
    setExpandedVariant(newVariant.id);
  };

  const updateVariant = (id: string, updates: Partial<ProductVariant>) => {
    onVariantsChange(variants.map(variant =>
      variant.id === id ? { ...variant, ...updates } : variant
    ));
  };

  const removeVariant = (id: string) => {
    onVariantsChange(variants.filter(variant => variant.id !== id));
    if (expandedVariant === id) {
      setExpandedVariant(null);
    }
  };

  const addAttribute = (variantId: string, key: string, value: string) => {
    const variant = variants.find(v => v.id === variantId);
    if (variant) {
      updateVariant(variantId, {
        attributes: { ...variant.attributes, [key]: value }
      });
    }
  };

  const removeAttribute = (variantId: string, key: string) => {
    const variant = variants.find(v => v.id === variantId);
    if (variant) {
      const newAttributes = { ...variant.attributes };
      delete newAttributes[key];
      updateVariant(variantId, { attributes: newAttributes });
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex justify-between items-center">
        <label className="block text-sm font-medium text-gray-700">
          Product Variants
        </label>
        <Button onClick={addVariant} variant="secondary" size="sm">
          <PlusIcon className="h-4 w-4 mr-1" />
          Add Variant
        </Button>
      </div>

      {variants.length === 0 ? (
        <div className="text-center py-8 bg-gray-50 rounded-lg">
          <p className="text-gray-500 mb-4">No variants added yet</p>
          <Button onClick={addVariant} variant="secondary">
            <PlusIcon className="h-4 w-4 mr-2" />
            Add First Variant
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {variants.map((variant, index) => (
            <div
              key={variant.id}
              className="border border-gray-200 rounded-lg overflow-hidden"
            >
              <div
                className="p-4 bg-gray-50 cursor-pointer flex justify-between items-center"
                onClick={() => setExpandedVariant(
                  expandedVariant === variant.id ? null : variant.id
                )}
              >
                <div>
                  <h4 className="font-medium text-gray-900">
                    {variant.name || `Variant ${index + 1}`}
                  </h4>
                  <p className="text-sm text-gray-500">
                    Price: +${variant.additionalPrice} | MOQ: {variant.moq}
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  {variant.images.length > 0 && (
                    <div className="flex -space-x-1">
                      {variant.images.slice(0, 3).map((img, i) => (
                        <img
                          key={i}
                          src={img.url}
                          className="h-8 w-8 rounded border-2 border-white object-cover"
                          alt=""
                        />
                      ))}
                      {variant.images.length > 3 && (
                        <div className="h-8 w-8 rounded border-2 border-white bg-gray-200 flex items-center justify-center text-xs">
                          +{variant.images.length - 3}
                        </div>
                      )}
                    </div>
                  )}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeVariant(variant.id);
                    }}
                    className="text-red-500 hover:text-red-700"
                  >
                    <XMarkIcon className="h-5 w-5" />
                  </button>
                </div>
              </div>

              {expandedVariant === variant.id && (
                <div className="p-4 space-y-4">
                  {/* Basic Info */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Variant Name *
                      </label>
                      <input
                        type="text"
                        value={variant.name}
                        onChange={(e) => updateVariant(variant.id, { name: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                        placeholder="e.g., Red Medium, Blue Large"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Variant SKU
                      </label>
                      <input
                        type="text"
                        value={variant.sku || ''}
                        onChange={(e) => updateVariant(variant.id, { sku: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                        placeholder="Auto-generated if empty"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Additional Price ($) *
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={variant.additionalPrice}
                        onChange={(e) => updateVariant(variant.id, { additionalPrice: parseFloat(e.target.value) || 0 })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        MOQ (Minimum Order Quantity) *
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={variant.moq}
                        onChange={(e) => updateVariant(variant.id, { moq: parseInt(e.target.value) || 1 })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                      />
                    </div>
                  </div>

                  {/* Attributes */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Variant Attributes
                    </label>
                    <div className="space-y-2">
                      {Object.entries(variant.attributes).map(([key, value]) => (
                        <div key={key} className="flex gap-2">
                          <input
                            type="text"
                            value={key}
                            onChange={(e) => {
                              const newKey = e.target.value;
                              if (newKey !== key) {
                                removeAttribute(variant.id, key);
                                addAttribute(variant.id, newKey, value);
                              }
                            }}
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                            placeholder="Attribute name (e.g., Color, Size)"
                          />
                          <input
                            type="text"
                            value={value}
                            onChange={(e) => addAttribute(variant.id, key, e.target.value)}
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                            placeholder="Attribute value (e.g., Red, Large)"
                          />
                          <button
                            onClick={() => removeAttribute(variant.id, key)}
                            className="px-3 py-2 text-red-500 hover:text-red-700"
                          >
                            <XMarkIcon className="h-5 w-5" />
                          </button>
                        </div>
                      ))}
                      <button
                        onClick={() => addAttribute(variant.id, '', '')}
                        className="text-sm text-primary-600 hover:text-primary-800"
                      >
                        + Add Attribute
                      </button>
                    </div>
                  </div>

                  {/* Images */}
                  <ImageUpload
                    images={variant.images}
                    onImagesChange={(images) => updateVariant(variant.id, { images })}
                    maxImages={5}
                    label="Variant Images"
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};