import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import zhHans from "./locales/zh-Hans.json";
import zhHant from "./locales/zh-Hant.json";
import enUS from "./locales/en-US.json";

i18n
  .use(initReactI18next)
  .init({
    resources: {
      "zh-Hans": { translation: zhHans },
      "zh-Hant": { translation: zhHant },
      "en-US": { translation: enUS },
    },
    lng: localStorage.getItem("vibebase_locale") || "zh-Hans",
    fallbackLng: "en-US",
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;






