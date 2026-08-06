"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import styles from "./shell-topbar.module.css";

type Locale = "ar" | "en";

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
    <div className={styles.locale} role="group" aria-label={label}>
      <button type="button" className={styles.localeOption} lang="en"
        aria-pressed={locale === "en"} disabled={isPending} onClick={() => switchTo("en")}>
        EN
      </button>
      <button type="button" className={styles.localeOption} lang="ar"
        aria-pressed={locale === "ar"} disabled={isPending} onClick={() => switchTo("ar")}>
        ع
      </button>
    </div>
  );
}
