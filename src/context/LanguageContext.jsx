import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import translations from '../i18n/translations';

const LanguageContext = createContext();

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState(() => localStorage.getItem('app_lang') || 'en');

  // Listen for language changes from the header dropdown
  useEffect(() => {
    const handler = (e) => {
      setLang(e.detail);
    };
    window.addEventListener('languageChange', handler);
    return () => window.removeEventListener('languageChange', handler);
  }, []);

  // Translate function: t('key') returns the translated string
  const t = useCallback((key) => {
    const entry = translations[key];
    if (!entry) return key; // fallback to key if translation missing
    return entry[lang] || entry['en'] || key;
  }, [lang]);

  // Change language programmatically
  const changeLang = useCallback((code) => {
    setLang(code);
    localStorage.setItem('app_lang', code);
    window.dispatchEvent(new CustomEvent('languageChange', { detail: code }));
  }, []);

  return (
    <LanguageContext.Provider value={{ lang, setLang: changeLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used within LanguageProvider');
  return ctx;
}
