import i18n from "i18next";
import { initReactI18next } from "react-i18next";

const resources = {
  en: {
    translation: {
      "New Chat": "New Chat",
      Save: "Save",
      Settings: "Settings",
      Tools: "Tools",
      Workflow: "Workflow",
    },
  },
  zh: {
    translation: {
      "New Chat": "新对话",
      Save: "保存",
      Settings: "设置",
      Tools: "工具",
      Workflow: "工作流",
    },
  },
};

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
