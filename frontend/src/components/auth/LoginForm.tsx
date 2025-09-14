import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../hooks/useAuth';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { LoginFormData } from '../../types';

const createLoginSchema = (t: (key: string) => string) => yup.object({
  email: yup.string().email(t('auth.validation.invalidEmail')).required(t('auth.validation.emailRequired')),
  password: yup.string().min(6, t('auth.validation.passwordMinLength')).required(t('auth.validation.passwordRequired')),
  userType: yup.string().oneOf(['admin', 'vendor']).required(t('auth.validation.userTypeRequired'))
});

interface LoginFormProps {
  onForgotPassword?: () => void;
  onRegister?: () => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({ onForgotPassword, onRegister }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { login, isLoading } = useAuth();
  const [userType, setUserType] = useState<'admin' | 'vendor'>('vendor');

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue
  } = useForm<LoginFormData>({
    resolver: yupResolver(createLoginSchema(t)),
    defaultValues: {
      userType: 'vendor'
    }
  });

  const handleUserTypeChange = (type: 'admin' | 'vendor') => {
    setUserType(type);
    setValue('userType', type);
  };

  const onSubmit = async (data: LoginFormData) => {
    try {
      await login(data);
      
      // Redirect after successful login
      console.log('✅ Login successful, redirecting...');
      if (data.userType === 'admin') {
        navigate('/admin/dashboard');
      } else {
        navigate('/dashboard');
      }
    } catch (error) {
      // Error is handled in the auth context
      console.error('❌ Login failed:', error);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="text-center">
          {t('auth.loginForm.title')}
        </CardTitle>
        
        <div className="flex space-x-2 mt-4">
          <button
            type="button"
            onClick={() => handleUserTypeChange('vendor')}
            className={`flex-1 py-2 px-4 text-sm font-medium rounded-md transition-colors ${
              userType === 'vendor'
                ? 'bg-primary-100 text-primary-700 border border-primary-300'
                : 'bg-gray-100 text-gray-700 border border-gray-300 hover:bg-gray-200'
            }`}
          >
            {t('auth.loginForm.vendorLogin')}
          </button>
          <button
            type="button"
            onClick={() => handleUserTypeChange('admin')}
            className={`flex-1 py-2 px-4 text-sm font-medium rounded-md transition-colors ${
              userType === 'admin'
                ? 'bg-primary-100 text-primary-700 border border-primary-300'
                : 'bg-gray-100 text-gray-700 border border-gray-300 hover:bg-gray-200'
            }`}
          >
            {t('auth.loginForm.adminLogin')}
          </button>
        </div>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <input type="hidden" {...register('userType')} />
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">
              {t('auth.loginForm.email')}
            </label>
            <input
              type="email"
              {...register('email')}
              placeholder={t('auth.loginForm.emailPlaceholder')}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
            />
            {errors.email && (
              <p className="text-sm text-red-600">{errors.email.message}</p>
            )}
          </div>

          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">
              {t('auth.loginForm.password')}
            </label>
            <input
              type="password"
              {...register('password')}
              placeholder={t('auth.loginForm.passwordPlaceholder')}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
            />
            {errors.password && (
              <p className="text-sm text-red-600">{errors.password.message}</p>
            )}
          </div>

          <Button
            type="submit"
            loading={isLoading}
            fullWidth
            className="mt-6"
          >
            {t('auth.loginForm.signIn')}
          </Button>

          <div className="flex items-center justify-between text-sm">
            {onForgotPassword && (
              <button
                type="button"
                onClick={onForgotPassword}
                className="text-primary-600 hover:text-primary-500"
              >
                {t('auth.loginForm.forgotPassword')}
              </button>
            )}
            
            {onRegister && userType === 'vendor' && (
              <button
                type="button"
                onClick={onRegister}
                className="text-primary-600 hover:text-primary-500"
              >
                {t('auth.loginForm.createAccount')}
              </button>
            )}
          </div>

          {userType === 'admin' && (
            <div className="mt-4 p-3 bg-blue-50 rounded-md">
              <p className="text-sm text-blue-700">
                <strong>{t('auth.loginForm.demoAdmin')}</strong><br />
                {t('auth.loginForm.demoEmail')}<br />
                {t('auth.loginForm.demoPassword')}
              </p>
            </div>
          )}
        </form>
      </CardContent>
    </Card>
  );
};