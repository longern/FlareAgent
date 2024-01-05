import i18n from "i18next";
import { initReactI18next } from "react-i18next";

const resources = {
  en: {
    translation: {
      "New Chat": "New Chat",
      "Next Node": "Next Node",
      "Node Name": "Node Name",
      Save: "Save",
      Settings: "Settings",
      "System Prompt": "System Prompt",
      Tools: "Tools",
      Workflow: "Workflow",
      "Workflow Name": "Workflow Name",
    },
  },
  zh: {
    translation: {
      "New Chat": "新对话",
      "Next Node": "下一节点",
      "Node Name": "节点名称",
      Save: "保存",
      Settings: "设置",
      "System Prompt": "系统提示词",
      Tools: "工具",
      Workflow: "工作流",
      "Workflow Name": "工作流名称",
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
