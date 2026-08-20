import {
  formatDate, formatDateTime, formatDayOfMonth, formatMonthShort, formatWeekdayShort, riyadhDateParts,
} from "@/lib/dates";
import type { Locale } from "@/lib/i18n";
import { executionMessages } from "./strings";

const SEPARATORS = /[_-]+/g;

export type ExecutionLabels = {
  readonly enumLabel: (value: string | null) => string;
  readonly date: (value: string | null) => string;
  readonly dateTime: (value: string | null) => string;
  readonly range: (from: string | null, to: string | null) => string;
  readonly count: (value: number) => string;
  readonly weekday: (value: string) => string;
  readonly dayNumber: (value: string) => string;
  readonly monthShort: (value: string) => string;
  readonly isMonthStart: (value: string) => boolean;
};

export function buildLabels(locale: Locale): ExecutionLabels {
  const messages = executionMessages(locale);
  const governed: Record<string, string> = messages.enum;
  const absent = messages.table.notRecorded;

  const enumLabel = (value: string | null): string => {
    if (!value) return absent;
    return governed[value]
      ?? value.replace(SEPARATORS, " ").replace(/^./, first => first.toLocaleUpperCase(locale));
  };

  const date = (value: string | null): string => value ? formatDate(value, locale) : absent;

  return {
    enumLabel,
    date,
    dateTime: value => value ? formatDateTime(value, locale) : absent,
    range: (from, to) => from && to
      ? `${date(from)} ${messages.table.rangeSeparator} ${date(to)}`
      : absent,
    count: value => value.toLocaleString(locale === "ar" ? "ar-SA" : "en-SA"),
    weekday: value => formatWeekdayShort(value, locale),
    dayNumber: value => formatDayOfMonth(value, locale),
    monthShort: value => formatMonthShort(value, locale),
    isMonthStart: value => riyadhDateParts(value).day === 1,
  };
}
