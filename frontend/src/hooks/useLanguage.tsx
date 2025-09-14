import React, { createContext, useContext, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from './useAuth';

interface LanguageContextType {
  language: string;
  setLanguage: (lang: string) => void;
  isVendorChinese: boolean;
  isAutoDetected: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const { i18n } = useTranslation();
  const { user, isVendor, isAdmin } = useAuth();
  const [isAutoDetected, setIsAutoDetected] = useState(true);

  // Get saved language preference or detect
  const getSavedLanguage = () => {
    return localStorage.getItem('language') || null;
  };

  // Detect user's preferred language
  const detectLanguage = () => {
    // Check browser language
    const browserLang = navigator.language.toLowerCase();
    if (browserLang.startsWith('zh')) {
      return 'zh';
    }
    return 'en';
  };

  // Determine if vendor should use Chinese
  const isVendorChinese = isVendor() && (getSavedLanguage() === 'zh' || (!getSavedLanguage() && detectLanguage() === 'zh'));

  const [language, setLanguageState] = useState(() => {
    const saved = getSavedLanguage();

    if (saved) {
      setIsAutoDetected(false);
      return saved;
    }

    // Auto-detect: Vendors get Chinese if browser is Chinese, Admins always get English
    if (isVendor()) {
      const detected = detectLanguage();
      return detected;
    }

    return 'en'; // Admins always get English
  });

  const setLanguage = (lang: string) => {
    setLanguageState(lang);
    setIsAutoDetected(false);
    localStorage.setItem('language', lang);
    i18n.changeLanguage(lang);
  };

  useEffect(() => {
    // Set language based on user role when user data loads
    if (user) {
      const saved = getSavedLanguage();

      if (saved) {
        // Use saved preference
        i18n.changeLanguage(saved);
        setIsAutoDetected(false);
      } else if (isAdmin()) {
        // Admins always get English
        i18n.changeLanguage('en');
        setLanguageState('en');
      } else if (isVendor()) {
        // Vendors get auto-detected language (Chinese if browser is Chinese)
        const detected = detectLanguage();
        i18n.changeLanguage(detected);
        setLanguageState(detected);
        setIsAutoDetected(true);
      }
    }
  }, [user, isVendor, isAdmin, i18n]);

  const value: LanguageContextType = {
    language,
    setLanguage,
    isVendorChinese,
    isAutoDetected
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}