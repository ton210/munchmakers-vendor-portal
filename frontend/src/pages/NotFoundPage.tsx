import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const NotFoundPage: React.FC = () => {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="text-center">
          <h1 className="text-6xl font-bold text-gray-900 mb-4">{t('errors.notFound.title')}</h1>
          <h2 className="text-2xl font-semibold text-gray-700 mb-4">{t('errors.notFound.subtitle')}</h2>
          <p className="text-gray-600 mb-8">
            {t('errors.notFound.message')}
          </p>
          <Link
            to="/"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            {t('errors.notFound.goHome')}
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NotFoundPage;