import type { Locale } from "@/lib/i18n";

/**
 * Single source for every user-facing number, the way `lib/dates.ts` is for
 * every user-facing date.
 *
 * Arabic reads Arabic-Indic digits (`٠١٢٣`), which `Intl.NumberFormat("ar-SA")`
 * produces and `String(value)` does not. A number that skips this renders Latin
 * digits inside an Arabic screen — a defect no gate can see, because the code is
 * legal and the English render is perfect.
 */
export function formatCount(value: number, locale: Locale, fractionDigits = 0): string {
  return new Intl.NumberFormat(locale === "ar" ? "ar-SA" : "en-US", {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  }).format(value);
}

/**
 * A whole percentage, with the sign on the side this application puts it.
 *
 * Deliberately not `Intl` percent style: for `ar-SA` that yields `٥٠٪؜` — the
 * sign trailing, plus an invisible ALM — while every existing surface here
 * renders `٪٥٠`. Moving the sign is a copy decision, not a formatting one.
 */
export function formatPercent(value: number, locale: Locale, fractionDigits = 0): string {
  const digits = formatCount(value, locale, fractionDigits);
  return locale === "ar" ? `٪${digits}` : `${digits}%`;
}
