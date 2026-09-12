import React, { createContext, useContext, useState, useEffect } from 'react';
import translations from './translation/translation';

const LanguageContext = createContext();

export const LanguageProvider = ({ children }) => {
  const [currentLanguage, setCurrentLanguage] = useState(() => {
    return localStorage.getItem('selectedLanguage') || 'ar';
  });

  const changeLanguage = (lang) => {
    setCurrentLanguage(lang);
    localStorage.setItem('selectedLanguage', lang);
    // Set document direction for RTL languages
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = lang;
  };

  const translate = (key, params = {}) => {
    try {
      // Get translation from the current language
      const currentTranslations = translations[currentLanguage];
      
      let translation = null;
      
      // Try to find translation with exact key first
      if (currentTranslations && currentTranslations[key]) {
        translation = currentTranslations[key];
      }
      // Fallback to English if translation not found
      else if (currentLanguage !== 'en' && translations.en && translations.en[key]) {
        translation = translations.en[key];
      }
      // Try with lowercase key as fallback
      else {
        const lowerCaseKey = key?.toLowerCase()
          ?.replace(/[^a-zA-Z0-9]/g, "_")
          ?.replace(/ /g, "_");
        
        if (currentTranslations && currentTranslations[lowerCaseKey]) {
          translation = currentTranslations[lowerCaseKey];
        }
        else if (currentLanguage !== 'en' && translations.en && translations.en[lowerCaseKey]) {
          translation = translations.en[lowerCaseKey];
        }
      }
      
      // If translation found, interpolate parameters
      if (translation) {
        return Object.keys(params)?.reduce((text, param) => {
          return text?.replace(new RegExp(`{${param}}`, 'g'), params[param]);
        }, translation);
      }

      // If no translation found, convert key to readable format
      const readableKey = key?.replace(/_/g, " ")
        .split(" ")
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");

      return readableKey;
    } catch (error) {
      console.error('Translation error:', error);
      return key;
    }
  };

  useEffect(() => {
    // Set initial document direction and language
    document.documentElement.dir = currentLanguage === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = currentLanguage;
  }, [currentLanguage]);

  const value = {
    currentLanguage,
    changeLanguage,
    translate,
    isRTL: currentLanguage === 'ar'
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

export default useLanguage;
