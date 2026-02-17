import { createContext, useContext, useEffect, useMemo, useState } from "react";
import {
  DEFAULT_LANGUAGE,
  Language,
  getStoredLanguage,
  onLanguageChange,
  setStoredLanguage,
  translate,
} from "./index";

type I18nContextValue = {
  language: Language;
  setLanguage: (language: Language) => void;
  t: (key: string, vars?: Record<string, string | number>) => string;
};

const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>(getStoredLanguage());

  useEffect(() => {
    const unsubscribe = onLanguageChange((lang) => {
      setLanguageState(lang);
    });
    return () => {
      unsubscribe();
    };
  }, []);

  const setLanguage = (next: Language) => {
    setStoredLanguage(next);
    setLanguageState(next);
  };

  const value = useMemo(
    () => ({
      language,
      setLanguage,
      t: (key: string, vars?: Record<string, string | number>) =>
        translate(language || DEFAULT_LANGUAGE, key, vars),
    }),
    [language],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error("useI18n must be used within I18nProvider");
  }
  return context;
}
