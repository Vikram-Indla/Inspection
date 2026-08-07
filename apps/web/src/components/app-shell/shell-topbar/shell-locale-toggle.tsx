"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import SegmentedControl, { type SegmentedOption } from "@/components/saqeel/segmented-control/segmented-control";

type Locale = "ar" | "en";

const LOCALES: readonly SegmentedOption<Locale>[] = [
  { value: "en", label: "EN", lang: "en" },
  { value: "ar", label: "ع", lang: "ar" },
];

function applyDocumentLocale(locale: Locale): void {
  document.documentElement.lang = locale;
  document.documentElement.dir = locale === "ar" ? "rtl" : "ltr";
}

export default function ShellLocaleToggle({ locale: serverLocale, label }: {
  locale: Locale;
  label: string;
}) {
  const router = useRouter();
  const [locale, setLocale] = useState<Locale>(serverLocale);
  const [isPending, startTransition] = useTransition();

  function switchTo(next: Locale): void {
    if (next === locale || isPending) return;
    const previous = locale;
    setLocale(next);
    applyDocumentLocale(next);
    startTransition(async () => {
      try {
        const response = await fetch("/locale", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ locale: next }),
        });
        if (!response.ok) throw new Error("shell_locale_update_failed");
        router.refresh();
      } catch {
        setLocale(previous);
        applyDocumentLocale(previous);
      }
    });
  }

  return (
    <SegmentedControl
      options={LOCALES}
      value={locale}
      onChange={switchTo}
      label={label}
      tone="accent"
      disabled={isPending}
    />
  );
}
