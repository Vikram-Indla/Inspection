/**
 * Governed date/time formatting (Saqeel V5.1 §7 "Governed dates and time").
 * Single source for every user-facing date: Asia/Riyadh timezone, explicit
 * Gregorian calendar, tabular numerals. Without an explicit `calendar`,
 * Intl.DateTimeFormat("ar-SA", ...) defaults to islamic-umalqura (Hijri) —
 * that silent default is the bug this file exists to prevent. Hijri display
 * is a separate, explicitly-opted-in concern (open decision, not this file).
 *
 * Not for <input type="date"> value wiring — those stay plain ISO
 * (toISOString().slice(0,10)) per the HTML date-input contract.
 */
import type { Locale } from "@/lib/i18n";

const TIME_ZONE = "Asia/Riyadh";
const CALENDAR = "gregory";

function toDate(value: string | number | Date): Date {
  return value instanceof Date ? value : new Date(value);
}

function intlLocale(locale: Locale): string {
  return locale === "ar" ? "ar-SA" : "en-SA";
}

// ICU's default part ORDER varies by locale even within one language family
// (en-SA renders "Jul 18, 2026", not the required "18 Jul 2026"). Pull the
// day/month/year parts and assemble them ourselves so the day-month-year
// contract is guaranteed regardless of locale-database ordering quirks.
function dateParts(value: string | number | Date, locale: Locale): { day: string; month: string; year: string } {
  const parts = new Intl.DateTimeFormat(intlLocale(locale), {
    timeZone: TIME_ZONE,
    calendar: CALENDAR,
    day: "numeric",
    month: "short",
    year: "numeric",
  }).formatToParts(toDate(value));
  const get = (type: string) => parts.find(p => p.type === type)?.value ?? "";
  return { day: get("day"), month: get("month"), year: get("year") };
}

/** "18 Jul 2026" / "١٨ يوليو ٢٠٢٦" — day-month-year, locale-ordering-proof. */
export function formatDate(value: string | number | Date, locale: Locale): string {
  const { day, month, year } = dateParts(value, locale);
  return `${day} ${month} ${year}`;
}

export function formatWeekdayShort(value: string | number | Date, locale: Locale): string {
  return new Intl.DateTimeFormat(intlLocale(locale), {
    timeZone: TIME_ZONE,
    calendar: CALENDAR,
    weekday: "short",
  }).format(toDate(value));
}

export function formatDayOfMonth(value: string | number | Date, locale: Locale): string {
  return new Intl.DateTimeFormat(intlLocale(locale), {
    timeZone: TIME_ZONE,
    calendar: CALENDAR,
    day: "numeric",
  }).format(toDate(value));
}

export function formatMonthShort(value: string | number | Date, locale: Locale): string {
  return new Intl.DateTimeFormat(intlLocale(locale), {
    timeZone: TIME_ZONE,
    calendar: CALENDAR,
    month: "short",
  }).format(toDate(value));
}

/** "18 Jul 2026, 11:40 (Riyadh)"; with `{ hour12: true }`,
 *  "18 Jul 2026, 8:28 PM (Riyadh)" / "١٨ يوليو ٢٠٢٦، ٨:٢٨ م (الرياض)". */
export function formatDateTime(
  value: string | number | Date,
  locale: Locale,
  options: { hour12?: boolean } = {},
): string {
  const hour12 = options.hour12 ?? false;
  const time = new Intl.DateTimeFormat(intlLocale(locale), {
    timeZone: TIME_ZONE,
    calendar: CALENDAR,
    hour: hour12 ? "numeric" : "2-digit",
    minute: "2-digit",
    hour12,
  }).format(toDate(value));
  const riyadhLabel = locale === "ar" ? "الرياض" : "Riyadh";
  return `${formatDate(value, locale)}, ${time} (${riyadhLabel})`;
}

/** "11:40" — Riyadh-local time only, for a same-day start->end window where
 *  repeating the full date on both ends would be redundant. */
export function formatTime(value: string | number | Date, locale: Locale): string {
  return new Intl.DateTimeFormat(intlLocale(locale), {
    timeZone: TIME_ZONE,
    calendar: CALENDAR,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(toDate(value));
}

/** Riyadh-local Y/M/D parts for the given instant — day-boundary arithmetic
 *  must use these, never raw UTC millisecond division (DST-safe, tz-safe). */
export function riyadhDateParts(value: string | number | Date): { year: number; month: number; day: number } {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: TIME_ZONE,
    calendar: "gregory",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(toDate(value));
  const get = (type: string) => Number(parts.find(p => p.type === type)?.value);
  return { year: get("year"), month: get("month"), day: get("day") };
}

/**
 * The Riyadh calendar day as `YYYY-MM-DD`.
 *
 * `toISOString().slice(0, 10)` is the UTC day, which rolls over three hours
 * early here — a date-bounded comparison made after 21:00 local would answer
 * for tomorrow.
 */
export function riyadhToday(value: string | number | Date = new Date()): string {
  const { year, month, day } = riyadhDateParts(value);
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

/**
 * The Riyadh-local instant as `YYYY-MM-DDTHH:mm` — the shape a date/time
 * control round-trips.
 *
 * `toISOString().slice(0, 16)` is the UTC instant, so a window edited through
 * it would be written back three hours early.
 */
export function riyadhLocalInput(value: string | number | Date): string {
  if (!value) return "";
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: TIME_ZONE,
    calendar: CALENDAR,
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", hour12: false,
  }).formatToParts(toDate(value));
  const get = (type: string) => parts.find(p => p.type === type)?.value ?? "";
  return `${get("year")}-${get("month")}-${get("day")}T${get("hour")}:${get("minute")}`;
}

function partsToUtcDays({ year, month, day }: { year: number; month: number; day: number }): number {
  return Date.UTC(year, month - 1, day) / 86_400_000;
}

/** Whole Riyadh-calendar-day difference: `to` minus `from` (positive = `to` is later). */
export function riyadhDayDiff(from: string | number | Date, to: string | number | Date): number {
  return partsToUtcDays(riyadhDateParts(to)) - partsToUtcDays(riyadhDateParts(from));
}

export function isBeforeRiyadhToday(value: string | number | Date, now: string | number | Date = new Date()): boolean {
  return riyadhDayDiff(value, now) > 0;
}

/** "6 Jul 2026 · 14 days overdue" / "6 Jul 2026 · due in 3 days" / "6 Jul 2026 · due today" */
export function formatDue(value: string | number | Date, locale: Locale, now: string | number | Date = new Date()): string {
  const date = formatDate(value, locale);
  const days = riyadhDayDiff(value, now); // positive: now is after due date (overdue)
  let suffix: string;
  if (days > 0) {
    suffix = locale === "ar" ? `متأخر ${days} ${days === 1 ? "يوم" : "أيام"}` : `${days} day${days === 1 ? "" : "s"} overdue`;
  } else if (days < 0) {
    const remaining = Math.abs(days);
    suffix = locale === "ar" ? `يستحق خلال ${remaining} ${remaining === 1 ? "يوم" : "أيام"}` : `due in ${remaining} day${remaining === 1 ? "" : "s"}`;
  } else {
    suffix = locale === "ar" ? "يستحق اليوم" : "due today";
  }
  return `${date} · ${suffix}`;
}

/** "1 Jul – 18 Jul 2026" / Arabic "من 1 يوليو إلى 18 يوليو 2026" with explicit from/to. */
export function formatDateRange(from: string | number | Date, to: string | number | Date, locale: Locale): string {
  if (locale === "ar") {
    return `من ${formatDate(from, locale)} إلى ${formatDate(to, locale)}`;
  }
  return `From ${formatDate(from, locale)} to ${formatDate(to, locale)}`;
}

/** Relative "just now" / "12m ago" / "3h ago" — falls back to formatDate beyond 24h. */
export function formatRelative(value: string | number | Date, locale: Locale, now: string | number | Date = new Date()): string {
  const diffMs = toDate(now).getTime() - toDate(value).getTime();
  const diffMin = Math.round(diffMs / 60_000);
  if (diffMin < 1) return locale === "ar" ? "الآن" : "just now";
  if (diffMin < 60) return locale === "ar" ? `قبل ${diffMin} د` : `${diffMin}m ago`;
  const diffHr = Math.round(diffMin / 60);
  if (diffHr < 24) return locale === "ar" ? `قبل ${diffHr} س` : `${diffHr}h ago`;
  return formatDate(value, locale);
}
