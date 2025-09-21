import { createContext, useContext, useEffect, useState, ReactNode, useMemo, memo } from 'react';
import { getStoredLanguage, setStoredLanguage, DEFAULT_LANGUAGE, SUPPORTED_LANGUAGES, t as translateFunction } from '@/lib/i18n';

interface LanguageContextType {
  language: string;
  setLanguage: (language: string) => void;
  isRTL: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

interface LanguageProviderProps {
  children: ReactNode;
}

export const LanguageProvider = memo(function LanguageProvider({ children }: LanguageProviderProps) {
  const [language, setLanguageState] = useState<string>(DEFAULT_LANGUAGE);
  const [isRTL, setIsRTL] = useState<boolean>(false);

  // Initialize language from storage
  useEffect(() => {
    const storedLanguage = getStoredLanguage();
    setLanguageState(storedLanguage);
    updateRTL(storedLanguage);
  }, []);

  // Update RTL state and document attributes
  const updateRTL = (lang: string) => {
    const rtl = ['ar', 'he', 'fa', 'ur'].includes(lang);
    setIsRTL(rtl);
    
    // Update document attributes for RTL support
    if (typeof document !== 'undefined') {
      document.documentElement.dir = rtl ? 'rtl' : 'ltr';
      document.documentElement.lang = lang;
    }
  };

  const setLanguage = (newLanguage: string) => {
    // Validate language is supported
    const isSupported = SUPPORTED_LANGUAGES.some(lang => lang.code === newLanguage);
    if (!isSupported) {
      console.warn(`Language ${newLanguage} is not supported, falling back to ${DEFAULT_LANGUAGE}`);
      newLanguage = DEFAULT_LANGUAGE;
    }

    console.log('LanguageProvider: Setting language from', language, 'to', newLanguage);
    setLanguageState(newLanguage);
    setStoredLanguage(newLanguage);
    updateRTL(newLanguage);
  };

  // Memoize context value to prevent unnecessary re-renders
  const value: LanguageContextType = useMemo(() => ({
    language,
    setLanguage,
    isRTL
  }), [language, setLanguage, isRTL]);

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
});

export function useLanguage(): LanguageContextType {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}

// Custom hook for translations
export function useTranslation() {
  const { language } = useLanguage();
  
  const t = (key: string): string => {
    return translateFunction(key, language);
  };

  return { t, language };
}