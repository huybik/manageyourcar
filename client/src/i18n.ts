/* /client/src/i18n.ts */
import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

// Import translations directly for bundling
import translationEN from "./locales/en/translation.json";
import translationVI from "./locales/vi/translation.json";

const resources = {
  en: {
    translation: translationEN,
  },
  vi: {
    translation: translationVI,
  },
};

i18n
  // Detect user language
  .use(LanguageDetector)
  // Pass the i18n instance to react-i18next.
  .use(initReactI18next)
  // Init i18next
  .init({
    resources,
    fallbackLng: "en", // Use English if detected language is not available
    debug: import.meta.env.DEV, // Enable debug output in development
    interpolation: {
      escapeValue: false, // React already safes from xss
    },
    detection: {
      // Order and from where user language should be detected
      order: ["localStorage", "navigator", "htmlTag"],
      // Cache user language in localStorage
      caches: ["localStorage"],
      // Key to use in localStorage
      lookupLocalStorage: "i18nextLng",
    },
  });

export default i18n;
