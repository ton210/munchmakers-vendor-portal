import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../hooks/useAuth';
import { LoginForm } from '../components/auth/LoginForm';
import { RegisterForm } from '../components/auth/RegisterForm';

export const LoginPage: React.FC = () => {
  const { t } = useTranslation();
  const { isAuthenticated, isAdmin, isVendor } = useAuth();
  const [showRegister, setShowRegister] = useState(false);

  // Redirect if already authenticated
  if (isAuthenticated) {
    if (isAdmin()) {
      return <Navigate to="/admin/dashboard" replace />;
    } else if (isVendor()) {
      return <Navigate to="/dashboard" replace />;
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-blue-100 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        {/* Header */}
        <div className="text-center mb-8">
          <img 
            src="https://cdn11.bigcommerce.com/s-tqjrceegho/images/stencil/500w/munchmakers-logo_1_1752112946__55141.original.png" 
            alt="MunchMakers Logo" 
            className="h-16 mx-auto mb-4"
          />
          <h1 className="text-3xl font-bold text-gray-900">
            {t('auth.loginPage.title')}
          </h1>
          <p className="text-gray-600 mt-2">
            {t('auth.loginPage.subtitle')}
          </p>
        </div>

        {/* Demo Credentials */}
        {!showRegister && (
          <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="text-sm font-medium text-blue-900 mb-3">{t('auth.loginPage.demoAccounts')}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="bg-white rounded p-3 border">
                <h4 className="font-medium text-gray-900 mb-2">{t('auth.loginPage.adminAccount')}</h4>
                <p className="text-gray-600">{t('auth.loginForm.demoEmail')}</p>
                <p className="text-gray-600">{t('auth.loginForm.demoPassword')}</p>
                <p className="text-xs text-gray-500 mt-1">{t('auth.loginPage.adminDescription')}</p>
              </div>
              <div className="bg-white rounded p-3 border">
                <h4 className="font-medium text-gray-900 mb-2">{t('auth.loginPage.vendorAccount')}</h4>
                <p className="text-gray-600">Email: demo@restaurant.com</p>
                <p className="text-gray-600">Password: demo123</p>
                <p className="text-xs text-gray-500 mt-1">{t('auth.loginPage.vendorDescription')}</p>
              </div>
            </div>
          </div>
        )}

        {/* Form Container */}
        {showRegister ? (
          <RegisterForm onBackToLogin={() => setShowRegister(false)} />
        ) : (
          <LoginForm 
            onRegister={() => setShowRegister(true)}
            onForgotPassword={() => {
              // TODO: Implement forgot password modal
              console.log('Forgot password clicked');
            }}
          />
        )}

        {/* Footer */}
        <div className="text-center mt-8 text-sm text-gray-600">
          <p>
            {t('auth.loginPage.needHelp')}{' '}
            <a href="mailto:vendor@munchmakers.com" className="text-indigo-600 hover:text-indigo-500">
              vendor@munchmakers.com
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};