import { createContext, useContext, useEffect, useMemo, useState } from 'react';

const LanguageContext = createContext(null);

const labels = {
  en: {
    home: 'Home',
    about: 'About',
    services: 'Services',
    contact: 'Help & Contact',
    login: 'Login',
    register: 'Register',
    dashboard: 'Dashboard',
    logout: 'Logout',
    requestAssistance: 'Request assistance',
    exploreServices: 'Explore services',
    language: 'Language',
  },
  rw: {
    home: 'Ahabanza',
    about: 'Ibyerekeye',
    services: 'Serivisi',
    contact: 'Ubufasha & guhuza',
    login: 'Injira',
    register: 'Iyandikishe',
    dashboard: 'Dashboard',
    logout: 'Gusohoka',
    requestAssistance: 'Saba ubufasha',
    exploreServices: 'Reba serivisi',
    language: 'Ururimi',
  },
};

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState(() => localStorage.getItem('preferred-language') || 'en');

  useEffect(() => {
    localStorage.setItem('preferred-language', language);
  }, [language]);

  const value = useMemo(() => ({
    language,
    setLanguage,
    t: labels[language] || labels.en,
  }), [language]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
