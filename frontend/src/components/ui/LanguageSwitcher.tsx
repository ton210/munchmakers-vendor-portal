import React from 'react';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '../../hooks/useLanguage';
import { GlobeAltIcon } from '@heroicons/react/24/outline';

export const LanguageSwitcher: React.FC = () => {
  const { t } = useTranslation();
  const { language, setLanguage, isAutoDetected } = useLanguage();

  const languages = [
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'zh', name: '中文', flag: '🇨🇳' }
  ];

  return (
    <div className="flex items-center space-x-2">
      <GlobeAltIcon className="h-4 w-4 text-gray-400" />

      <div className="flex items-center space-x-1">
        {languages.map((lang) => (
          <button
            key={lang.code}
            onClick={() => setLanguage(lang.code)}
            className={`flex items-center px-2 py-1 rounded-md text-xs transition-colors ${
              language === lang.code
                ? 'bg-primary-500 text-white shadow-sm'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
            title={`Switch to ${lang.name}`}
          >
            <span className="mr-1">{lang.flag}</span>
            {lang.code.toUpperCase()}
          </button>
        ))}
      </div>

      {isAutoDetected && (
        <div className="text-xs text-gray-400">
          <span className="inline-flex items-center">
            <span className="w-1 h-1 bg-blue-400 rounded-full mr-1"></span>
            Auto
          </span>
        </div>
      )}
    </div>
  );
};