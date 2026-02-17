import es from "./es.json";
import en from "./en.json";
import ca from "./ca.json";

export type Language = "es" | "en" | "ca";

export const DEFAULT_LANGUAGE: Language = "es";
const STORAGE_KEY = "pm_lang";
const LANGUAGE_EVENT = "pm_language_change";

const translations: Record<Language, Record<string, string>> = {
  es,
  en,
  ca,
};

export const isLanguage = (value: string | null): value is Language =>
  value === "es" || value === "en" || value === "ca";

export const getStoredLanguage = (): Language => {
  if (typeof window === "undefined") {
    return DEFAULT_LANGUAGE;
  }
  const stored = window.localStorage?.getItem(STORAGE_KEY);
  return isLanguage(stored) ? stored : DEFAULT_LANGUAGE;
};

export const setStoredLanguage = (language: Language) => {
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage?.setItem(STORAGE_KEY, language);
  window.dispatchEvent(new CustomEvent(LANGUAGE_EVENT, { detail: language }));
};

export const onLanguageChange = (callback: (lang: Language) => void) => {
  const handler = (event: Event) => {
    const custom = event as CustomEvent<Language>;
    if (custom.detail && isLanguage(custom.detail)) {
      callback(custom.detail);
    }
  };
  window.addEventListener(LANGUAGE_EVENT, handler);
  return () => window.removeEventListener(LANGUAGE_EVENT, handler);
};

const interpolate = (value: string, vars?: Record<string, string | number>) => {
  if (!vars) {
    return value;
  }
  return Object.keys(vars).reduce(
    (acc, key) => acc.replace(new RegExp(`\\{${key}\\}`, "g"), String(vars[key])),
    value,
  );
};

export const translate = (
  language: Language,
  key: string,
  vars?: Record<string, string | number>,
) => {
  const dict = translations[language] || translations[DEFAULT_LANGUAGE];
  const fallback = translations[DEFAULT_LANGUAGE][key] || key;
  const value = dict[key] || fallback;
  return interpolate(value, vars);
};
