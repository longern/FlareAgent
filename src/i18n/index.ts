import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import resources from "./locales.json";

i18n
  .use(initReactI18next)
  .use({
    type: "languageDetector",
    async: true,
    detect: (cb: (lang: string) => void) =>
      cb(
        typeof window !== "undefined"
          ? window.navigator.language + "-default"
          : "en"
      ),
    init: () => {},
    cacheUserLanguage: () => {},
  })
  .init({
    resources,
    interpolation: {
      escapeValue: false, // react already safes from xss
    },
  });

export default i18n;
