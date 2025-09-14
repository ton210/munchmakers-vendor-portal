import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Layout } from '../../components/layout/Layout';
import { Button } from '../../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { ImageUpload, ImageFile } from '../../components/ui/ImageUpload';
import { VariantManager, ProductVariant } from '../../components/ui/VariantManager';
import { PricingTiers, PricingTier } from '../../components/ui/PricingTiers';
import {
  ArrowLeftIcon,
  InformationCircleIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { vendorService } from '../../services/vendorService';
import toast from 'react-hot-toast';

interface ProductFormData {
  // Required fields
  name: string;
  price: number;
  moq: number;

  // Optional basic info
  description: string;
  details: string;
  sku: string;
  weight: number;
  height: number;
  dimensions: string;
  productionTime: number;
  categoryId: number;

  // Images
  productImages: ImageFile[];
  productionImages: ImageFile[];

  // Variants and pricing
  variants: ProductVariant[];
  pricingTiers: PricingTier[];

  // Shipping
  shippingOptions: {
    air: { available: boolean; basePrice: number; pricePerKg: number };
    fastBoat: { available: boolean; basePrice: number; pricePerKg: number };
  };

  // Design tools
  designToolInfo: string;
  designToolTemplate: string;

  // Status
  status: 'draft' | 'pending' | 'approved' | 'rejected';
}

const defaultFormData: ProductFormData = {
  name: '',
  price: 0,
  moq: 1,
  description: '',
  details: '',
  sku: '',
  weight: 0,
  height: 0,
  dimensions: '',
  productionTime: 7,
  categoryId: 1,
  productImages: [],
  productionImages: [],
  variants: [],
  pricingTiers: [],
  shippingOptions: {
    air: { available: true, basePrice: 0, pricePerKg: 0 },
    fastBoat: { available: true, basePrice: 0, pricePerKg: 0 }
  },
  designToolInfo: '',
  designToolTemplate: '',
  status: 'draft'
};

const ProductForm: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = Boolean(id);

  const [formData, setFormData] = useState<ProductFormData>(defaultFormData);
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [currentStep, setCurrentStep] = useState(1);

  const steps = [
    { id: 1, title: 'Basic Information', description: 'Product name, price, and details' },
    { id: 2, title: 'Images & Media', description: 'Product and production images' },
    { id: 3, title: 'Variants & Pricing', description: 'Product variants and pricing tiers' },
    { id: 4, title: 'Shipping & Tools', description: 'Shipping options and design tools' },
    { id: 5, title: 'Review & Submit', description: 'Review all information before submitting' }
  ];

  useEffect(() => {
    loadCategories();
    if (isEditing && id) {
      loadProduct(id);
    }
  }, [isEditing, id]);

  const loadCategories = async () => {
    try {
      // TODO: Implement category loading from BigCommerce
      setCategories([
        { id: 1, name: 'Food & Beverages' },
        { id: 2, name: 'Home & Garden' },
        { id: 3, name: 'Electronics' }
      ]);
    } catch (error) {
      console.error('Failed to load categories:', error);
    }
  };

  const loadProduct = async (productId: string) => {
    setLoading(true);
    try {
      // TODO: Implement product loading
      console.log('Loading product:', productId);
    } catch (error) {
      toast.error('Failed to load product');
    } finally {
      setLoading(false);
    }
  };

  const updateFormData = (updates: Partial<ProductFormData>) => {
    setFormData(prev => ({ ...prev, ...updates }));
  };

  const validateStep = (step: number): boolean => {
    const newErrors: { [key: string]: string } = {};

    switch (step) {
      case 1: // Basic Information
        if (!formData.name) newErrors.name = 'Product name is required';
        if (formData.price <= 0) newErrors.price = 'Price must be greater than 0';
        if (formData.moq < 1) newErrors.moq = 'MOQ must be at least 1';
        break;

      case 2: // Images & Media
        if (formData.productImages.length === 0) {
          newErrors.productImages = 'At least one product image is required';
        }
        break;

      case 3: // Variants & Pricing
        if (formData.variants.length > 0) {
          formData.variants.forEach((variant, index) => {
            if (!variant.name) {
              newErrors[`variant_${index}_name`] = `Variant ${index + 1} name is required`;
            }
            if (variant.moq < 1) {
              newErrors[`variant_${index}_moq`] = `Variant ${index + 1} MOQ must be at least 1`;
            }
          });
        }
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, steps.length));
    }
  };

  const handlePrevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleSaveAsDraft = async () => {
    setLoading(true);
    try {
      const productData = {
        name: formData.name,
        description: formData.description,
        details: formData.details,
        sku: formData.sku,
        price: formData.price,
        moq: formData.moq,
        weight: formData.weight,
        height: formData.height,
        dimensions: formData.dimensions,
        productionTime: formData.productionTime,
        categoryId: formData.categoryId,
        shippingOptions: formData.shippingOptions,
        designToolInfo: formData.designToolInfo,
        designToolTemplate: formData.designToolTemplate,
        productionImages: formData.productionImages.map(img => ({ url: img.url })),
        variants: formData.variants.map(v => ({
          name: v.name,
          sku: v.sku,
          additionalPrice: v.additionalPrice,
          moq: v.moq,
          attributes: v.attributes,
          images: v.images.map(img => ({ url: img.url }))
        })),
        pricingTiers: formData.pricingTiers,
        productImages: formData.productImages.map(img => ({ url: img.url })),
        status: 'draft'
      };

      const response = await vendorService.createProduct(productData);
      if (response.success) {
        toast.success('Product saved as draft');
        navigate('/products');
      } else {
        toast.error(response.message || 'Failed to save product');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to save product');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitForReview = async () => {
    // Validate all steps
    let isValid = true;
    for (let i = 1; i <= steps.length - 1; i++) {
      if (!validateStep(i)) {
        isValid = false;
      }
    }

    if (!isValid) {
      toast.error('Please fix all validation errors before submitting');
      return;
    }

    setLoading(true);
    try {
      const productData = {
        name: formData.name,
        description: formData.description,
        details: formData.details,
        sku: formData.sku,
        price: formData.price,
        moq: formData.moq,
        weight: formData.weight,
        height: formData.height,
        dimensions: formData.dimensions,
        productionTime: formData.productionTime,
        categoryId: formData.categoryId,
        shippingOptions: formData.shippingOptions,
        designToolInfo: formData.designToolInfo,
        designToolTemplate: formData.designToolTemplate,
        productionImages: formData.productionImages.map(img => ({ url: img.url })),
        variants: formData.variants.map(v => ({
          name: v.name,
          sku: v.sku,
          additionalPrice: v.additionalPrice,
          moq: v.moq,
          attributes: v.attributes,
          images: v.images.map(img => ({ url: img.url }))
        })),
        pricingTiers: formData.pricingTiers,
        productImages: formData.productImages.map(img => ({ url: img.url })),
        status: 'pending'
      };

      const response = await vendorService.createProduct(productData);
      if (response.success) {
        toast.success('Product submitted for review');
        navigate('/products');
      } else {
        toast.error(response.message || 'Failed to submit product');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to submit product');
    } finally {
      setLoading(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Product Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => updateFormData({ name: e.target.value })}
                  className={`w-full px-3 py-2 border rounded-md focus:ring-indigo-500 focus:border-indigo-500 ${
                    errors.name ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="Enter product name"
                />
                {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Product SKU
                </label>
                <input
                  type="text"
                  value={formData.sku}
                  onChange={(e) => updateFormData({ sku: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Auto-generated if empty"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Base Price ($) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.price}
                  onChange={(e) => updateFormData({ price: parseFloat(e.target.value) || 0 })}
                  className={`w-full px-3 py-2 border rounded-md focus:ring-indigo-500 focus:border-indigo-500 ${
                    errors.price ? 'border-red-300' : 'border-gray-300'
                  }`}
                />
                {errors.price && <p className="mt-1 text-sm text-red-600">{errors.price}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Minimum Order Quantity *
                </label>
                <input
                  type="number"
                  min="1"
                  value={formData.moq}
                  onChange={(e) => updateFormData({ moq: parseInt(e.target.value) || 1 })}
                  className={`w-full px-3 py-2 border rounded-md focus:ring-indigo-500 focus:border-indigo-500 ${
                    errors.moq ? 'border-red-300' : 'border-gray-300'
                  }`}
                />
                {errors.moq && <p className="mt-1 text-sm text-red-600">{errors.moq}</p>}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category
              </label>
              <select
                value={formData.categoryId}
                onChange={(e) => updateFormData({ categoryId: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
              >
                {categories.map(category => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Product Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => updateFormData({ description: e.target.value })}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Describe your product..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Product Details
              </label>
              <textarea
                value={formData.details}
                onChange={(e) => updateFormData({ details: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Additional product details..."
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Weight (kg)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.weight}
                  onChange={(e) => updateFormData({ weight: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Height (cm)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.height}
                  onChange={(e) => updateFormData({ height: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Production Time (days)
                </label>
                <input
                  type="number"
                  min="1"
                  value={formData.productionTime}
                  onChange={(e) => updateFormData({ productionTime: parseInt(e.target.value) || 1 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Dimensions (L × W × H)
              </label>
              <input
                type="text"
                value={formData.dimensions}
                onChange={(e) => updateFormData({ dimensions: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="e.g., 10cm × 5cm × 3cm"
              />
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-8">
            <ImageUpload
              images={formData.productImages}
              onImagesChange={(images) => updateFormData({ productImages: images })}
              label="Product Images *"
              maxImages={10}
              className={errors.productImages ? 'border-red-300' : ''}
            />
            {errors.productImages && <p className="text-sm text-red-600">{errors.productImages}</p>}

            <ImageUpload
              images={formData.productionImages}
              onImagesChange={(images) => updateFormData({ productionImages: images })}
              label="Production Images"
              maxImages={5}
            />
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex">
                <InformationCircleIcon className="h-5 w-5 text-blue-400 mt-0.5 mr-3 flex-shrink-0" />
                <div>
                  <h4 className="text-sm font-medium text-blue-800">Image Guidelines</h4>
                  <div className="mt-2 text-sm text-blue-700">
                    <ul className="list-disc ml-5 space-y-1">
                      <li>Use high-quality images (minimum 800x800 pixels)</li>
                      <li>The first product image will be used as the primary image</li>
                      <li>Production images show your manufacturing process</li>
                      <li>Supported formats: PNG, JPG, GIF (max 10MB each)</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-8">
            <VariantManager
              variants={formData.variants}
              onVariantsChange={(variants) => updateFormData({ variants })}
            />

            <PricingTiers
              tiers={formData.pricingTiers}
              onTiersChange={(tiers) => updateFormData({ pricingTiers: tiers })}
              basePrice={formData.price}
            />
          </div>
        );

      case 4:
        return (
          <div className="space-y-8">
            {/* Shipping Options */}
            <Card>
              <CardHeader>
                <CardTitle>Shipping Options</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Air Shipping */}
                <div className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center mb-4">
                    <input
                      type="checkbox"
                      id="air-shipping"
                      checked={formData.shippingOptions.air.available}
                      onChange={(e) => updateFormData({
                        shippingOptions: {
                          ...formData.shippingOptions,
                          air: { ...formData.shippingOptions.air, available: e.target.checked }
                        }
                      })}
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                    />
                    <label htmlFor="air-shipping" className="ml-3 text-sm font-medium text-gray-700">
                      Air Shipping (Faster)
                    </label>
                  </div>

                  {formData.shippingOptions.air.available && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Base Price ($)
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={formData.shippingOptions.air.basePrice}
                          onChange={(e) => updateFormData({
                            shippingOptions: {
                              ...formData.shippingOptions,
                              air: {
                                ...formData.shippingOptions.air,
                                basePrice: parseFloat(e.target.value) || 0
                              }
                            }
                          })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Price per kg ($)
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={formData.shippingOptions.air.pricePerKg}
                          onChange={(e) => updateFormData({
                            shippingOptions: {
                              ...formData.shippingOptions,
                              air: {
                                ...formData.shippingOptions.air,
                                pricePerKg: parseFloat(e.target.value) || 0
                              }
                            }
                          })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Fast Boat Shipping */}
                <div className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center mb-4">
                    <input
                      type="checkbox"
                      id="boat-shipping"
                      checked={formData.shippingOptions.fastBoat.available}
                      onChange={(e) => updateFormData({
                        shippingOptions: {
                          ...formData.shippingOptions,
                          fastBoat: { ...formData.shippingOptions.fastBoat, available: e.target.checked }
                        }
                      })}
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                    />
                    <label htmlFor="boat-shipping" className="ml-3 text-sm font-medium text-gray-700">
                      Fast Boat Shipping (Economical)
                    </label>
                  </div>

                  {formData.shippingOptions.fastBoat.available && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Base Price ($)
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={formData.shippingOptions.fastBoat.basePrice}
                          onChange={(e) => updateFormData({
                            shippingOptions: {
                              ...formData.shippingOptions,
                              fastBoat: {
                                ...formData.shippingOptions.fastBoat,
                                basePrice: parseFloat(e.target.value) || 0
                              }
                            }
                          })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Price per kg ($)
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={formData.shippingOptions.fastBoat.pricePerKg}
                          onChange={(e) => updateFormData({
                            shippingOptions: {
                              ...formData.shippingOptions,
                              fastBoat: {
                                ...formData.shippingOptions.fastBoat,
                                pricePerKg: parseFloat(e.target.value) || 0
                              }
                            }
                          })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Design Tools */}
            <Card>
              <CardHeader>
                <CardTitle>Design Tools</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Design Tool Information
                  </label>
                  <textarea
                    value={formData.designToolInfo}
                    onChange={(e) => updateFormData({ designToolInfo: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Information about design tools or customization options..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Design Tool Template
                  </label>
                  <textarea
                    value={formData.designToolTemplate}
                    onChange={(e) => updateFormData({ designToolTemplate: e.target.value })}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Template or specifications for design customization..."
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        );

      case 5:
        return (
          <div className="space-y-6">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex">
                <ExclamationTriangleIcon className="h-5 w-5 text-yellow-400 mt-0.5 mr-3 flex-shrink-0" />
                <div>
                  <h4 className="text-sm font-medium text-yellow-800">Review Before Submitting</h4>
                  <p className="mt-1 text-sm text-yellow-700">
                    Please review all the information below. Once submitted for review,
                    you won't be able to edit until the admin responds.
                  </p>
                </div>
              </div>
            </div>

            {/* Review Summary */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Basic Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <dl className="space-y-2">
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Product Name</dt>
                      <dd className="text-sm text-gray-900">{formData.name || 'Not set'}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Price</dt>
                      <dd className="text-sm text-gray-900">${formData.price.toFixed(2)}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">MOQ</dt>
                      <dd className="text-sm text-gray-900">{formData.moq}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Production Time</dt>
                      <dd className="text-sm text-gray-900">{formData.productionTime} days</dd>
                    </div>
                  </dl>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Media & Content</CardTitle>
                </CardHeader>
                <CardContent>
                  <dl className="space-y-2">
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Product Images</dt>
                      <dd className="text-sm text-gray-900">{formData.productImages.length} images</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Production Images</dt>
                      <dd className="text-sm text-gray-900">{formData.productionImages.length} images</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Variants</dt>
                      <dd className="text-sm text-gray-900">{formData.variants.length} variants</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Pricing Tiers</dt>
                      <dd className="text-sm text-gray-900">{formData.pricingTiers.length} tiers</dd>
                    </div>
                  </dl>
                </CardContent>
              </Card>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  if (loading) {
    return (
      <Layout title={isEditing ? "Edit Product" : "Add Product"}>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title={isEditing ? "Edit Product" : "Add Product"}>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <button
              onClick={() => navigate('/products')}
              className="mr-4 text-gray-400 hover:text-gray-600"
            >
              <ArrowLeftIcon className="h-6 w-6" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {isEditing ? 'Edit Product' : 'Add New Product'}
              </h1>
              <p className="text-gray-600 mt-1">
                Step {currentStep} of {steps.length}: {steps[currentStep - 1]?.title}
              </p>
            </div>
          </div>
          <Button onClick={handleSaveAsDraft} variant="secondary" disabled={loading}>
            Save as Draft
          </Button>
        </div>

        {/* Progress Steps */}
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <div
                key={step.id}
                className={`flex items-center ${index !== steps.length - 1 ? 'flex-1' : ''}`}
              >
                <div
                  className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium ${
                    currentStep >= step.id
                      ? 'bg-indigo-600 text-white'
                      : 'bg-gray-300 text-gray-600'
                  }`}
                >
                  {step.id}
                </div>
                <div className="ml-3">
                  <p className={`text-sm font-medium ${
                    currentStep >= step.id ? 'text-indigo-600' : 'text-gray-500'
                  }`}>
                    {step.title}
                  </p>
                  <p className="text-xs text-gray-400">{step.description}</p>
                </div>
                {index !== steps.length - 1 && (
                  <div className="flex-1 mx-4">
                    <div className={`h-0.5 ${
                      currentStep > step.id ? 'bg-indigo-600' : 'bg-gray-300'
                    }`} />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Form Content */}
        <Card>
          <CardContent className="p-6">
            {renderStepContent()}
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex justify-between">
          <Button
            onClick={handlePrevStep}
            variant="secondary"
            disabled={currentStep === 1}
          >
            Previous
          </Button>

          <div className="flex space-x-3">
            {currentStep < steps.length ? (
              <Button onClick={handleNextStep}>
                Next
              </Button>
            ) : (
              <Button onClick={handleSubmitForReview} disabled={loading}>
                {loading ? 'Submitting...' : 'Submit for Review'}
              </Button>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default ProductForm;