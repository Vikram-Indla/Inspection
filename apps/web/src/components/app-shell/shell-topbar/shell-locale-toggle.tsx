"use client";

import { useTransition } from "react";
import SegmentedControl, { type SegmentedOption } from "@/components/saqeel/segmented-control/segmented-control";
import { switchLocale } from "@/features/shell/locale-actions";
import type { Locale } from "@/lib/locale-path";

const LOCALES: readonly SegmentedOption<Locale>[] = [
  { value: "en", label: "EN", lang: "en" },
  { value: "ar", label: "ع", lang: "ar" },
];

export default function ShellLocaleToggle({ locale, label }: {
  locale: Locale;
  label: string;
}) {
  const [isPending, startTransition] = useTransition();

  function choose(next: Locale): void {
    if (next === locale || isPending) return;
    startTransition(() => {
      void switchLocale(next, window.location.search);
    });
  }

  return (
    <SegmentedControl
      options={LOCALES}
      value={locale}
      onChange={choose}
      label={label}
      tone="accent"
      disabled={isPending}
    />
  );
}
