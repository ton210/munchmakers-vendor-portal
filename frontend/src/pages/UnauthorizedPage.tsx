import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../hooks/useAuth';

const UnauthorizedPage: React.FC = () => {
  const { t } = useTranslation();
  const { isAdmin, isVendor } = useAuth();

  const getHomeLink = () => {
    if (isAdmin()) return '/admin';
    if (isVendor()) return '/dashboard';
    return '/login';
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="text-center">
          <div className="text-6xl mb-4">🚫</div>
          <h1 className="text-2xl font-semibold text-gray-700 mb-4">{t('errors.unauthorized.title')}</h1>
          <p className="text-gray-600 mb-8">
            {t('errors.unauthorized.message')}
          </p>
          <Link
            to={getHomeLink()}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            {t('errors.unauthorized.goToDashboard')}
          </Link>
        </div>
      </div>
    </div>
  );
};

export default UnauthorizedPage;