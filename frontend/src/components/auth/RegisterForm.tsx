import React from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useAuth } from '../../hooks/useAuth';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';

const registerSchema = yup.object({
  businessName: yup.string().required('Business name is required'),
  contactEmail: yup.string().email('Invalid email').required('Email is required'),
  contactName: yup.string().required('Contact name is required'),
  phone: yup.string().required('Phone number is required'),
  businessAddress: yup.string().required('Business address is required'),
  businessType: yup.string().required('Business type is required'),
  website: yup.string().url('Invalid URL').optional(),
  taxId: yup.string().required('Tax ID is required'),
  password: yup.string().min(8, 'Password must be at least 8 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, 'Password must contain uppercase, lowercase, number, and special character')
    .required('Password is required'),
  confirmPassword: yup.string()
    .oneOf([yup.ref('password')], 'Passwords must match')
    .required('Please confirm your password')
});

interface RegisterFormData {
  businessName: string;
  contactEmail: string;
  contactName: string;
  phone: string;
  businessAddress: string;
  businessType: string;
  website?: string;
  taxId: string;
  password: string;
  confirmPassword: string;
}

interface RegisterFormProps {
  onBackToLogin?: () => void;
}

export const RegisterForm: React.FC<RegisterFormProps> = ({ onBackToLogin }) => {
  const { login, isLoading } = useAuth();

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<RegisterFormData>({
    resolver: yupResolver(registerSchema)
  });

  const onSubmit = async (data: RegisterFormData) => {
    try {
      // Remove confirmPassword before sending to API
      const { confirmPassword, ...registerData } = data;
      
      // Note: This would call the register API
      await login({
        email: data.contactEmail,
        password: data.password,
        userType: 'vendor'
      });
    } catch (error) {
      // Error is handled in the auth context
    }
  };

  const businessTypes = [
    'Manufacturer',
    'Distributor',
    'Retailer',
    'Drop Shipper',
    'Other'
  ];

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="text-center">
          Register as a Vendor
        </CardTitle>
        <p className="text-center text-gray-600 mt-2">
          Join the MunchMakers network and start selling your products
        </p>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Business Name"
              {...register('businessName')}
              error={errors.businessName?.message}
              placeholder="Your Business Name"
            />

            <Input
              label="Contact Name"
              {...register('contactName')}
              error={errors.contactName?.message}
              placeholder="Your Full Name"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Email"
              type="email"
              {...register('contactEmail')}
              error={errors.contactEmail?.message}
              placeholder="your@email.com"
            />

            <Input
              label="Phone"
              type="tel"
              {...register('phone')}
              error={errors.phone?.message}
              placeholder="+1 (555) 123-4567"
            />
          </div>

          <Input
            label="Business Address"
            {...register('businessAddress')}
            error={errors.businessAddress?.message}
            placeholder="Full business address"
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Business Type
              </label>
              <select
                {...register('businessType')}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              >
                <option value="">Select business type</option>
                {businessTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
              {errors.businessType && (
                <p className="text-sm text-red-600 mt-1">{errors.businessType.message}</p>
              )}
            </div>

            <Input
              label="Tax ID / EIN"
              {...register('taxId')}
              error={errors.taxId?.message}
              placeholder="12-3456789"
            />
          </div>

          <Input
            label="Website (Optional)"
            type="url"
            {...register('website')}
            error={errors.website?.message}
            placeholder="https://yourwebsite.com"
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Password"
              type="password"
              {...register('password')}
              error={errors.password?.message}
              placeholder="Create a secure password"
            />

            <Input
              label="Confirm Password"
              type="password"
              {...register('confirmPassword')}
              error={errors.confirmPassword?.message}
              placeholder="Confirm your password"
            />
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
            <h4 className="text-sm font-medium text-yellow-800">Before you submit:</h4>
            <ul className="mt-2 text-sm text-yellow-700 list-disc list-inside space-y-1">
              <li>Your application will be reviewed by our team</li>
              <li>You'll receive an email notification once approved</li>
              <li>Have your business documents ready for verification</li>
            </ul>
          </div>

          <div className="flex space-x-4">
            {onBackToLogin && (
              <Button
                type="button"
                variant="secondary"
                onClick={onBackToLogin}
                className="flex-1"
              >
                Back to Login
              </Button>
            )}
            
            <Button
              type="submit"
              loading={isLoading}
              className="flex-1"
            >
              Submit Application
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};