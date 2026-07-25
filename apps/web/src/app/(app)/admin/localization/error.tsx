"use client";

import { useEffect, useState } from "react";
import EmptyState from "@/components/EmptyState";
import { IconGlobe } from "@/app/icons";

export default function LocalizationError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const [locale, setLocale] = useState<"en" | "ar">("en");

  useEffect(() => {
    setLocale(document.documentElement.lang === "ar" ? "ar" : "en");
  }, []);

  const isArabic = locale === "ar";
  return (
    <main className="sq-content" role="alert">
      <EmptyState
        icon={<IconGlobe size={28} />}
        title={isArabic ? "تعذّر فتح سجل الترجمات" : "The localization registry could not be opened"}
        body={isArabic
          ? "تعذّر التحقق من الهوية أو الصلاحيات أو تحميل البيانات. لم يتغيّر شيء."
          : "Identity, permission, or registry data could not be verified. Nothing was changed."}
      >
        <button type="button" className="btn btn-primary btn-touch" onClick={reset}>
          {isArabic ? "إعادة المحاولة" : "Try again"}
        </button>
      </EmptyState>
    </main>
  );
}
