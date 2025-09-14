import React from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../hooks/useAuth';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';

const createRegisterSchema = (t: (key: string) => string) => yup.object({
  businessName: yup.string().required(t('auth.validation.businessNameRequired')),
  contactEmail: yup.string().email(t('auth.validation.invalidEmail')).required(t('auth.validation.emailRequired')),
  contactName: yup.string().required(t('auth.validation.contactNameRequired')),
  phone: yup.string().required(t('auth.validation.phoneRequired')),
  businessAddress: yup.string().required(t('auth.validation.businessAddressRequired')),
  businessType: yup.string().required(t('auth.validation.businessTypeRequired')),
  website: yup.string().url(t('auth.validation.invalidUrl')).optional(),
  taxId: yup.string().required(t('auth.validation.taxIdRequired')),
  password: yup.string().min(8, t('auth.validation.passwordMinLengthRegister'))
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, t('auth.validation.passwordComplexity'))
    .required(t('auth.validation.passwordRequired')),
  confirmPassword: yup.string()
    .oneOf([yup.ref('password')], t('auth.validation.passwordsMatch'))
    .required(t('auth.validation.confirmPasswordRequired'))
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
  const { t } = useTranslation();
  const { login, isLoading } = useAuth();

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<RegisterFormData>({
    resolver: yupResolver(createRegisterSchema(t))
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
    { value: 'manufacturer', label: t('auth.registerForm.businessTypes.manufacturer') },
    { value: 'distributor', label: t('auth.registerForm.businessTypes.distributor') },
    { value: 'retailer', label: t('auth.registerForm.businessTypes.retailer') },
    { value: 'dropShipper', label: t('auth.registerForm.businessTypes.dropShipper') },
    { value: 'other', label: t('auth.registerForm.businessTypes.other') }
  ];

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="text-center">
          {t('auth.registerForm.title')}
        </CardTitle>
        <p className="text-center text-gray-600 mt-2">
          {t('auth.registerForm.subtitle')}
        </p>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label={t('auth.registerForm.businessName')}
              {...register('businessName')}
              error={errors.businessName?.message}
              placeholder={t('auth.registerForm.businessNamePlaceholder')}
            />

            <Input
              label={t('auth.registerForm.contactName')}
              {...register('contactName')}
              error={errors.contactName?.message}
              placeholder={t('auth.registerForm.contactNamePlaceholder')}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label={t('auth.registerForm.email')}
              type="email"
              {...register('contactEmail')}
              error={errors.contactEmail?.message}
              placeholder={t('auth.registerForm.emailPlaceholder')}
            />

            <Input
              label={t('auth.registerForm.phone')}
              type="tel"
              {...register('phone')}
              error={errors.phone?.message}
              placeholder={t('auth.registerForm.phonePlaceholder')}
            />
          </div>

          <Input
            label={t('auth.registerForm.businessAddress')}
            {...register('businessAddress')}
            error={errors.businessAddress?.message}
            placeholder={t('auth.registerForm.addressPlaceholder')}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('auth.registerForm.businessType')}
              </label>
              <select
                {...register('businessType')}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
              >
                <option value="">{t('auth.registerForm.selectBusinessType')}</option>
                {businessTypes.map(type => (
                  <option key={type.value} value={type.value}>{type.label}</option>
                ))}
              </select>
              {errors.businessType && (
                <p className="text-sm text-red-600 mt-1">{errors.businessType.message}</p>
              )}
            </div>

            <Input
              label={t('auth.registerForm.taxId')}
              {...register('taxId')}
              error={errors.taxId?.message}
              placeholder={t('auth.registerForm.taxIdPlaceholder')}
            />
          </div>

          <Input
            label={t('auth.registerForm.website')}
            type="url"
            {...register('website')}
            error={errors.website?.message}
            placeholder={t('auth.registerForm.websitePlaceholder')}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label={t('auth.registerForm.password')}
              type="password"
              {...register('password')}
              error={errors.password?.message}
              placeholder={t('auth.registerForm.passwordPlaceholder')}
            />

            <Input
              label={t('auth.registerForm.confirmPassword')}
              type="password"
              {...register('confirmPassword')}
              error={errors.confirmPassword?.message}
              placeholder={t('auth.registerForm.confirmPasswordPlaceholder')}
            />
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
            <h4 className="text-sm font-medium text-yellow-800">{t('auth.registerForm.beforeSubmit')}</h4>
            <ul className="mt-2 text-sm text-yellow-700 list-disc list-inside space-y-1">
              <li>{t('auth.registerForm.reviewProcess')}</li>
              <li>{t('auth.registerForm.emailNotification')}</li>
              <li>{t('auth.registerForm.documentsReady')}</li>
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
                {t('auth.registerForm.backToLogin')}
              </Button>
            )}
            
            <Button
              type="submit"
              loading={isLoading}
              className="flex-1"
            >
              {t('auth.registerForm.submitApplication')}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};