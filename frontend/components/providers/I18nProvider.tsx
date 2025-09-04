"use client";

import { useEffect } from "react";
import "@/lib/utils/i18n";

interface I18nProviderProps {
  children: React.ReactNode;
}

export default function I18nProvider({ children }: I18nProviderProps) {
  useEffect(() => {
    // i18n'in client-side'da initialize edilmesini sağla
    // Bu component sadece i18n'in hazır olmasını garanti eder
  }, []);

  return <>{children}</>;
}
