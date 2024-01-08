import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import resources from "./locales.json";

const defaultLanguage =
  typeof window !== "undefined" ? window.navigator.language : "en";

i18n
  .use(initReactI18next) // passes i18n down to react-i18next
  .init({
    lng: defaultLanguage,
    resources,
    interpolation: {
      escapeValue: false, // react already safes from xss
    },
  });

export default i18n;
