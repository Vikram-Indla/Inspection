"use client";

import RouteError from "@/components/saqeel/route-error/route-error";
import ar from "@/i18n/locales/ar/reviews.json";
import en from "@/i18n/locales/en/reviews.json";

export default function ReviewDetailError({ error, reset }: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const isArabic = typeof document !== "undefined" && document.documentElement.lang === "ar";
  const strings = (isArabic ? ar : en).error;
  return (
    <RouteError
      title={strings.title}
      body={strings.body}
      retryLabel={strings.retry}
      reference={error.digest}
      referenceLabel={strings.reference}
      onRetry={reset}
    />
  );
}
