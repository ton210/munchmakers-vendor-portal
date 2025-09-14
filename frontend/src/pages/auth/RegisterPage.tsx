import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { 
  BuildingStorefrontIcon,
  UserIcon,
  EnvelopeIcon,
  PhoneIcon,
  MapPinIcon,
  CreditCardIcon,
  BanknotesIcon,
  DocumentTextIcon,
  ShieldCheckIcon,
  InformationCircleIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

interface VendorRegistrationData {
  // Business Information
  businessName: string;
  businessType: string;
  businessDescription: string;
  website: string;
  foundedYear: string;
  employeeCount: string;

  // Contact Information  
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  contactTitle: string;

  // Business Address
  businessAddress: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;

  // Legal Information
  taxId: string;
  businessLicense: string;
  incorporationState: string;
  businessStructure: string;

  // Banking Information (Optional)
  bankName: string;
  accountHolderName: string;
  routingNumber: string;
  accountNumber: string;
  accountType: string;

  // Marketplace Information
  previousMarketplaces: string;
  expectedMonthlyVolume: string;
  productCategories: string[];
  hasInsurance: boolean;
  insuranceProvider: string;

  // Compliance & Vetting
  backgroundCheckConsent: boolean;
  termsAccepted: boolean;
  privacyPolicyAccepted: boolean;
  marketplaceAgreementAccepted: boolean;
}

const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState<VendorRegistrationData>({
    businessName: '',
    businessType: '',
    businessDescription: '',
    website: '',
    foundedYear: '',
    employeeCount: '',
    contactName: '',
    contactEmail: '',
    contactPhone: '',
    contactTitle: '',
    businessAddress: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'United States',
    taxId: '',
    businessLicense: '',
    incorporationState: '',
    businessStructure: '',
    bankName: '',
    accountHolderName: '',
    routingNumber: '',
    accountNumber: '',
    accountType: '',
    previousMarketplaces: '',
    expectedMonthlyVolume: '',
    productCategories: [],
    hasInsurance: false,
    insuranceProvider: '',
    backgroundCheckConsent: false,
    termsAccepted: false,
    privacyPolicyAccepted: false,
    marketplaceAgreementAccepted: false
  });

  const totalSteps = 5;

  const handleInputChange = (field: keyof VendorRegistrationData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleNext = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      console.log('🔄 Submitting vendor application...', formData);
      
      // Call the registration API
      const response = await fetch('/api/auth/vendor/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          businessName: formData.businessName,
          businessType: formData.businessType,
          businessDescription: formData.businessDescription,
          website: formData.website,
          contactName: formData.contactName,
          contactEmail: formData.contactEmail,
          contactPhone: formData.contactPhone,
          businessAddress: formData.businessAddress,
          city: formData.city,
          state: formData.state,
          zipCode: formData.zipCode,
          country: formData.country,
          taxId: formData.taxId,
          businessLicense: formData.businessLicense,
          businessStructure: formData.businessStructure,
          bankName: formData.bankName,
          accountHolderName: formData.accountHolderName,
          // Note: Don't send sensitive banking details in this demo
          backgroundCheckConsent: formData.backgroundCheckConsent,
          termsAccepted: formData.termsAccepted
        }),
      });

      const result = await response.json();
      
      if (result.success) {
        console.log('✅ Vendor application submitted successfully');
        toast.success('Vendor application submitted successfully! You will receive an email once reviewed.');
        navigate('/login', { 
          state: { 
            message: 'Application submitted! Check your email for approval status.',
            type: 'success'
          }
        });
      } else {
        console.error('❌ Registration failed:', result.message);
        toast.error(result.message || 'Failed to submit application');
      }
    } catch (error: any) {
      console.error('❌ Registration error:', error);
      toast.error('Failed to submit application');
    } finally {
      setSubmitting(false);
    }
  };

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1:
        return !!(formData.businessName && formData.businessType && formData.contactName && formData.contactEmail);
      case 2:
        return !!(formData.businessAddress && formData.city && formData.state && formData.zipCode);
      case 3:
        return !!(formData.taxId && formData.businessLicense);
      case 4:
        return true; // Banking info is optional
      case 5:
        return formData.backgroundCheckConsent && formData.termsAccepted && formData.privacyPolicyAccepted && formData.marketplaceAgreementAccepted;
      default:
        return false;
    }
  };

  const businessTypes = [
    'Restaurant', 'Food Truck', 'Catering Company', 'Bakery', 'Brewery', 'Winery', 
    'Coffee Shop', 'Deli', 'Grocery Store', 'Specialty Food', 'Farm', 'Food Manufacturer',
    'Food Distributor', 'Other Food Business'
  ];

  const businessStructures = [
    'Sole Proprietorship', 'LLC', 'Corporation', 'Partnership', 'S-Corporation', 'Non-Profit'
  ];

  const employeeCounts = [
    '1-5 employees', '6-10 employees', '11-25 employees', '26-50 employees', '51-100 employees', '100+ employees'
  ];

  const expectedVolumes = [
    'Under $1,000/month', '$1,000-$5,000/month', '$5,000-$15,000/month', 
    '$15,000-$50,000/month', '$50,000-$100,000/month', 'Over $100,000/month'
  ];

  const StepIndicator = () => (
    <div className="mb-8">
      <div className="flex items-center justify-center space-x-4">
        {Array.from({ length: totalSteps }, (_, i) => i + 1).map((step) => (
          <div key={step} className="flex items-center">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                step < currentStep
                  ? 'bg-green-500 text-white'
                  : step === currentStep
                  ? 'bg-primary-500 text-white'
                  : 'bg-gray-200 text-gray-600'
              }`}
            >
              {step < currentStep ? <CheckCircleIcon className="w-4 h-4" /> : step}
            </div>
            {step < totalSteps && (
              <div
                className={`w-16 h-0.5 ${
                  step < currentStep ? 'bg-green-500' : 'bg-gray-200'
                }`}
              />
            )}
          </div>
        ))}
      </div>
      <div className="text-center mt-4">
        <div className="text-sm text-gray-600">
          Step {currentStep} of {totalSteps}
        </div>
        <div className="text-xs text-gray-500 mt-1">
          {currentStep === 1 && 'Business & Contact Information'}
          {currentStep === 2 && 'Business Address & Location'}
          {currentStep === 3 && 'Legal & Tax Information'}
          {currentStep === 4 && 'Banking Information (Optional)'}
          {currentStep === 5 && 'Terms & Final Review'}
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-blue-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <BuildingStorefrontIcon className="h-8 w-8 text-primary-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Join MunchMakers Marketplace</h1>
                <p className="text-sm text-gray-600">Partner with us to reach thousands of customers</p>
              </div>
            </div>
            <button
              onClick={() => navigate('/login')}
              className="text-sm text-primary-600 hover:text-primary-700 font-medium"
            >
              Already have an account? Sign in
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-xl shadow-lg p-8">
          <StepIndicator />

          {/* Step 1: Business & Contact Information */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <BuildingStorefrontIcon className="w-12 h-12 text-primary-600 mx-auto mb-4" />
                <h2 className="text-xl font-bold text-gray-900">Tell Us About Your Business</h2>
                <p className="text-gray-600 mt-2">We need some basic information to get started</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input
                  label="Business Name *"
                  value={formData.businessName}
                  onChange={(e) => handleInputChange('businessName', e.target.value)}
                  placeholder="Your Restaurant or Business Name"
                  required
                />
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Business Type *
                  </label>
                  <select
                    value={formData.businessType}
                    onChange={(e) => handleInputChange('businessType', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                    required
                  >
                    <option value="">Select your business type</option>
                    {businessTypes.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>

                <Input
                  label="Contact Person *"
                  value={formData.contactName}
                  onChange={(e) => handleInputChange('contactName', e.target.value)}
                  placeholder="Primary contact person"
                  required
                />

                <Input
                  label="Contact Title"
                  value={formData.contactTitle}
                  onChange={(e) => handleInputChange('contactTitle', e.target.value)}
                  placeholder="Owner, Manager, etc."
                />

                <Input
                  label="Business Email *"
                  type="email"
                  value={formData.contactEmail}
                  onChange={(e) => handleInputChange('contactEmail', e.target.value)}
                  placeholder="business@example.com"
                  required
                />

                <Input
                  label="Business Phone *"
                  type="tel"
                  value={formData.contactPhone}
                  onChange={(e) => handleInputChange('contactPhone', e.target.value)}
                  placeholder="(555) 123-4567"
                  required
                />

                <Input
                  label="Website"
                  type="url"
                  value={formData.website}
                  onChange={(e) => handleInputChange('website', e.target.value)}
                  placeholder="https://yourbusiness.com"
                />

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Number of Employees
                  </label>
                  <select
                    value={formData.employeeCount}
                    onChange={(e) => handleInputChange('employeeCount', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="">Select employee count</option>
                    {employeeCounts.map(count => (
                      <option key={count} value={count}>{count}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Business Description
                </label>
                <textarea
                  value={formData.businessDescription}
                  onChange={(e) => handleInputChange('businessDescription', e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                  placeholder="Tell us about your business, what you do, and what products you'd like to sell on MunchMakers..."
                />
              </div>
            </div>
          )}

          {/* Step 2: Business Address */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <MapPinIcon className="w-12 h-12 text-primary-600 mx-auto mb-4" />
                <h2 className="text-xl font-bold text-gray-900">Business Location</h2>
                <p className="text-gray-600 mt-2">Where is your business located?</p>
              </div>

              <div className="grid grid-cols-1 gap-6">
                <Input
                  label="Business Address *"
                  value={formData.businessAddress}
                  onChange={(e) => handleInputChange('businessAddress', e.target.value)}
                  placeholder="123 Main Street, Suite 100"
                  required
                />

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Input
                    label="City *"
                    value={formData.city}
                    onChange={(e) => handleInputChange('city', e.target.value)}
                    placeholder="New York"
                    required
                  />

                  <Input
                    label="State *"
                    value={formData.state}
                    onChange={(e) => handleInputChange('state', e.target.value)}
                    placeholder="NY"
                    required
                  />

                  <Input
                    label="ZIP Code *"
                    value={formData.zipCode}
                    onChange={(e) => handleInputChange('zipCode', e.target.value)}
                    placeholder="10001"
                    required
                  />
                </div>

                <Input
                  label="Country *"
                  value={formData.country}
                  onChange={(e) => handleInputChange('country', e.target.value)}
                  placeholder="United States"
                  required
                />
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start">
                  <InformationCircleIcon className="h-5 w-5 text-blue-500 mr-3 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-medium text-blue-900">Why we need your address</h4>
                    <p className="text-sm text-blue-800 mt-1">
                      We use your business address for tax purposes, shipping coordination, 
                      and to verify your business legitimacy as part of our marketplace standards.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Legal & Tax Information */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <DocumentTextIcon className="w-12 h-12 text-primary-600 mx-auto mb-4" />
                <h2 className="text-xl font-bold text-gray-900">Legal Information</h2>
                <p className="text-gray-600 mt-2">Required for compliance and tax reporting</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input
                  label="Tax ID (EIN) *"
                  value={formData.taxId}
                  onChange={(e) => handleInputChange('taxId', e.target.value)}
                  placeholder="XX-XXXXXXX"
                  required
                />

                <Input
                  label="Business License Number *"
                  value={formData.businessLicense}
                  onChange={(e) => handleInputChange('businessLicense', e.target.value)}
                  placeholder="Your business license number"
                  required
                />

                <Input
                  label="Founded Year"
                  type="number"
                  value={formData.foundedYear}
                  onChange={(e) => handleInputChange('foundedYear', e.target.value)}
                  placeholder="2020"
                  min="1900"
                  max="2025"
                />

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Business Structure
                  </label>
                  <select
                    value={formData.businessStructure}
                    onChange={(e) => handleInputChange('businessStructure', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="">Select business structure</option>
                    {businessStructures.map(structure => (
                      <option key={structure} value={structure}>{structure}</option>
                    ))}
                  </select>
                </div>

                <Input
                  label="State of Incorporation"
                  value={formData.incorporationState}
                  onChange={(e) => handleInputChange('incorporationState', e.target.value)}
                  placeholder="Delaware, Nevada, etc."
                />
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-start">
                  <ExclamationTriangleIcon className="h-5 w-5 text-yellow-500 mr-3 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-medium text-yellow-900">Important</h4>
                    <p className="text-sm text-yellow-800 mt-1">
                      All information will be verified. Please ensure accuracy as false information 
                      may result in application rejection or account suspension.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Banking Information (Optional) */}
          {currentStep === 4 && (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <BanknotesIcon className="w-12 h-12 text-primary-600 mx-auto mb-4" />
                <h2 className="text-xl font-bold text-gray-900">Banking Information</h2>
                <p className="text-gray-600 mt-2">Optional: For faster payment processing setup</p>
              </div>

              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                <div className="flex items-start">
                  <ShieldCheckIcon className="h-5 w-5 text-green-500 mr-3 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-medium text-green-900">Secure & Optional</h4>
                    <p className="text-sm text-green-800 mt-1">
                      Banking information is encrypted and optional. You can also provide this later 
                      in your vendor dashboard after approval.
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input
                  label="Bank Name"
                  value={formData.bankName}
                  onChange={(e) => handleInputChange('bankName', e.target.value)}
                  placeholder="Chase, Bank of America, etc."
                />

                <Input
                  label="Account Holder Name"
                  value={formData.accountHolderName}
                  onChange={(e) => handleInputChange('accountHolderName', e.target.value)}
                  placeholder="Business name as it appears on account"
                />

                <Input
                  label="Routing Number"
                  value={formData.routingNumber}
                  onChange={(e) => handleInputChange('routingNumber', e.target.value)}
                  placeholder="9-digit routing number"
                  maxLength={9}
                />

                <Input
                  label="Account Number"
                  type="password"
                  value={formData.accountNumber}
                  onChange={(e) => handleInputChange('accountNumber', e.target.value)}
                  placeholder="Account number"
                />

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Account Type
                  </label>
                  <select
                    value={formData.accountType}
                    onChange={(e) => handleInputChange('accountType', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="">Select account type</option>
                    <option value="Checking">Business Checking</option>
                    <option value="Savings">Business Savings</option>
                  </select>
                </div>
              </div>

              <div className="text-center">
                <button
                  type="button"
                  onClick={() => {
                    // Clear banking info if they choose to skip
                    setFormData(prev => ({
                      ...prev,
                      bankName: '',
                      accountHolderName: '',
                      routingNumber: '',
                      accountNumber: '',
                      accountType: ''
                    }));
                  }}
                  className="text-sm text-gray-500 hover:text-gray-700"
                >
                  Skip this step - I'll add banking info later
                </button>
              </div>
            </div>
          )}

          {/* Step 5: Terms & Review */}
          {currentStep === 5 && (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <ShieldCheckIcon className="w-12 h-12 text-primary-600 mx-auto mb-4" />
                <h2 className="text-xl font-bold text-gray-900">Terms & Agreement</h2>
                <p className="text-gray-600 mt-2">Final step: Review and accept our terms</p>
              </div>

              {/* Application Summary */}
              <div className="bg-gray-50 rounded-lg p-6 mb-6">
                <h3 className="font-medium text-gray-900 mb-4">Application Summary</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Business:</span>
                    <span className="ml-2 font-medium">{formData.businessName}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Type:</span>
                    <span className="ml-2 font-medium">{formData.businessType}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Contact:</span>
                    <span className="ml-2 font-medium">{formData.contactName}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Email:</span>
                    <span className="ml-2 font-medium">{formData.contactEmail}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Location:</span>
                    <span className="ml-2 font-medium">{formData.city}, {formData.state}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Tax ID:</span>
                    <span className="ml-2 font-medium">{formData.taxId}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <label className="flex items-start space-x-3">
                  <input
                    type="checkbox"
                    checked={formData.backgroundCheckConsent}
                    onChange={(e) => handleInputChange('backgroundCheckConsent', e.target.checked)}
                    className="mt-1 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    required
                  />
                  <div className="text-sm">
                    <span className="font-medium text-gray-900">Background Check Consent *</span>
                    <p className="text-gray-600 mt-1">
                      I consent to a background check and business verification as part of the 
                      marketplace vetting process.
                    </p>
                  </div>
                </label>

                <label className="flex items-start space-x-3">
                  <input
                    type="checkbox"
                    checked={formData.termsAccepted}
                    onChange={(e) => handleInputChange('termsAccepted', e.target.checked)}
                    className="mt-1 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    required
                  />
                  <div className="text-sm">
                    <span className="font-medium text-gray-900">Terms of Service *</span>
                    <p className="text-gray-600 mt-1">
                      I have read and agree to the{' '}
                      <a href="#" className="text-primary-600 hover:text-primary-700">Terms of Service</a>
                    </p>
                  </div>
                </label>

                <label className="flex items-start space-x-3">
                  <input
                    type="checkbox"
                    checked={formData.privacyPolicyAccepted}
                    onChange={(e) => handleInputChange('privacyPolicyAccepted', e.target.checked)}
                    className="mt-1 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    required
                  />
                  <div className="text-sm">
                    <span className="font-medium text-gray-900">Privacy Policy *</span>
                    <p className="text-gray-600 mt-1">
                      I acknowledge the{' '}
                      <a href="#" className="text-primary-600 hover:text-primary-700">Privacy Policy</a>
                    </p>
                  </div>
                </label>

                <label className="flex items-start space-x-3">
                  <input
                    type="checkbox"
                    checked={formData.marketplaceAgreementAccepted}
                    onChange={(e) => handleInputChange('marketplaceAgreementAccepted', e.target.checked)}
                    className="mt-1 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    required
                  />
                  <div className="text-sm">
                    <span className="font-medium text-gray-900">Marketplace Agreement *</span>
                    <p className="text-gray-600 mt-1">
                      I agree to the marketplace commission structure, payment terms, and 
                      quality standards outlined in the{' '}
                      <a href="#" className="text-primary-600 hover:text-primary-700">Vendor Agreement</a>
                    </p>
                  </div>
                </label>
              </div>

              <div className="bg-primary-50 border border-primary-200 rounded-lg p-4">
                <h4 className="text-sm font-medium text-primary-900 mb-2">What happens next?</h4>
                <ul className="text-sm text-primary-800 space-y-1">
                  <li>• Application review within 2-3 business days</li>
                  <li>• Background and business verification check</li>
                  <li>• Email notification with approval status</li>
                  <li>• Access to vendor dashboard upon approval</li>
                  <li>• Onboarding call to set up your store</li>
                </ul>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between pt-6 border-t border-gray-200 mt-8">
            <Button
              variant="secondary"
              onClick={handlePrevious}
              disabled={currentStep === 1}
            >
              Previous
            </Button>

            <div className="flex space-x-3">
              <Button
                variant="secondary"
                onClick={() => navigate('/login')}
              >
                Save & Continue Later
              </Button>

              {currentStep < totalSteps ? (
                <Button
                  onClick={handleNext}
                  disabled={!validateStep(currentStep)}
                >
                  Continue
                </Button>
              ) : (
                <Button
                  onClick={handleSubmit}
                  loading={submitting}
                  disabled={!validateStep(currentStep)}
                  className="px-8"
                >
                  Submit Application
                </Button>
              )}
            </div>
          </div>

          {/* Progress indicator */}
          <div className="mt-6 text-center">
            <div className="text-xs text-gray-500">
              Application progress: {Math.round((currentStep / totalSteps) * 100)}% complete
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="text-center py-8 text-sm text-gray-600">
        <p>Questions about the application process?</p>
        <p>Contact our vendor support team: <a href="mailto:vendors@munchmakers.com" className="text-primary-600 hover:text-primary-700">vendors@munchmakers.com</a></p>
      </div>
    </div>
  );
};

export default RegisterPage;