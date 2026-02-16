import { createContext, useContext, useState, useEffect } from 'react';

const LanguageContext = createContext();

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState(() => {
    const storedLanguage = localStorage.getItem('language');
    // Migrate old 'km' to new 'kh'
    if (storedLanguage === 'km') {
      localStorage.setItem('language', 'kh');
      return 'kh';
    }
    return storedLanguage ? storedLanguage : 'en'; 
  });

  const [titleLanguage, setTitleLanguage] = useState(() => {
    const storedTitleLanguage = localStorage.getItem('titleLanguage');
    return storedTitleLanguage ? storedTitleLanguage : 'en';
  });

  useEffect(() => {
    localStorage.setItem('language', language);
  }, [language]);

  useEffect(() => {
    localStorage.setItem('titleLanguage', titleLanguage);
  }, [titleLanguage]);

  const toggleLanguage = (lang) => {
    setLanguage(lang);
  };

  const toggleTitleLanguage = (lang) => {
    setTitleLanguage(lang);
  };

  return (
    <LanguageContext.Provider value={{ language, toggleLanguage, titleLanguage, toggleTitleLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  return useContext(LanguageContext);
};
