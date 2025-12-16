import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import zhCN from "./locales/zh-CN.json";
import zhTW from "./locales/zh-TW.json";
import enUS from "./locales/en-US.json";

i18n
  .use(initReactI18next)
  .init({
    resources: {
      "zh-CN": { translation: zhCN },
      "zh-TW": { translation: zhTW },
      "en-US": { translation: enUS },
    },
    lng: localStorage.getItem("vibebase_locale") || "zh-CN",
    fallbackLng: "en-US",
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;






