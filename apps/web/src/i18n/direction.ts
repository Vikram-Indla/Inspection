import type { Locale } from "@/lib/i18n";

/**
 * Whether the locale reads right to left.
 *
 * Direction is layout, not copy — WEB-013 §3 keeps it in code.
 *
 * This lives here rather than in `lib/i18n` because that module imports
 * `next/headers` and is therefore server-only: a client component reaching for
 * it fails the build outright. Everything here is a pure function over a
 * type-only import, so a client bundle can hold it.
 *
 * Reach for it only where a component must lay itself out along the inline axis
 * because CSS cannot — a charting library with no writing-mode support, say.
 * Anything CSS can express uses logical properties instead (WEB-002 §6).
 */
export function isRtl(locale: Locale): boolean {
  return locale === "ar";
}
