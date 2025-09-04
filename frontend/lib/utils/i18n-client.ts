"use client";

import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import "@/lib/utils/i18n";

export function useI18n() {
  const { i18n } = useTranslation();

  useEffect(() => {
    // i18n is already initialized in the imported file
    // Bu hook sadece i18n'in hazır olduğundan emin olmak için
  }, []);

  return {
    changeLanguage: (lang: string) => {
      i18n.changeLanguage(lang);
      if (typeof window !== "undefined") {
        localStorage.setItem("lang", lang);
      }
    },
    currentLanguage: i18n.language,
  };
}
