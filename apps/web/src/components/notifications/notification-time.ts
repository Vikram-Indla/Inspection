import { formatDate, riyadhDayDiff } from "@/lib/dates";
import type { Locale } from "@/lib/i18n";

const MINUTE_MS = 60_000;
const MINUTES_PER_HOUR = 60;
const HOURS_PER_DAY = 24;

function relativeFormatter(locale: Locale): Intl.RelativeTimeFormat {
  return new Intl.RelativeTimeFormat(locale, { numeric: "auto" });
}

export function notificationTime(createdAt: string, locale: Locale, now: Date, justNow: string): string {
  const minutes = Math.floor((now.getTime() - new Date(createdAt).getTime()) / MINUTE_MS);
  if (minutes < 1) return justNow;
  const relative = relativeFormatter(locale);
  if (minutes < MINUTES_PER_HOUR) return relative.format(-minutes, "minute");
  const hours = Math.floor(minutes / MINUTES_PER_HOUR);
  if (hours < HOURS_PER_DAY) return relative.format(-hours, "hour");
  if (riyadhDayDiff(createdAt, now) === 1) return relative.format(-1, "day");
  return formatDate(createdAt, locale);
}
