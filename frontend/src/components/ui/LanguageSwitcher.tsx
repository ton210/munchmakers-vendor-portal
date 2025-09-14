import React from 'react';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '../../hooks/useLanguage';
import { useAuth } from '../../hooks/useAuth';
import { GlobeAltIcon } from '@heroicons/react/24/outline';

export const LanguageSwitcher: React.FC = () => {
  const { t } = useTranslation();
  const { language, setLanguage, isAutoDetected } = useLanguage();
  const { isAdmin } = useAuth();

  // Don't show language switcher for admins (English only)
  if (isAdmin()) {
    return null;
  }

  const languages = [
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'zh', name: '中文', flag: '🇨🇳' }
  ];

  return (
    <div className="flex items-center space-x-4">
      <div className="flex items-center text-gray-400">
        <GlobeAltIcon className="h-4 w-4 mr-2" />
        <span className="text-sm">{t('footer.language')}</span>
      </div>

      <div className="flex items-center space-x-2">
        {languages.map((lang) => (
          <button
            key={lang.code}
            onClick={() => setLanguage(lang.code)}
            className={`flex items-center px-3 py-1 rounded-md text-sm transition-colors ${
              language === lang.code
                ? 'bg-indigo-600 text-white'
                : 'text-gray-400 hover:text-white hover:bg-gray-700'
            }`}
          >
            <span className="mr-2">{lang.flag}</span>
            {lang.name}
          </button>
        ))}
      </div>

      {isAutoDetected && (
        <div className="text-xs text-gray-500">
          <span className="inline-flex items-center">
            <span className="w-2 h-2 bg-blue-400 rounded-full mr-1"></span>
            Auto-detected
          </span>
        </div>
      )}
    </div>
  );
};