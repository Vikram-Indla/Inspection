import { humaniseEnum } from "@/lib/text";
import type { Locale } from "@/lib/i18n";
import { getMessages } from "./messages";

export type EnumLabel = (value: string) => string;

/**
 * Reads a database enum value's label from `visits.enum` in the caller's
 * locale. A value with no entry falls back to `humaniseEnum`, which formats
 * the identifier rather than translating it — that path is a defect to close
 * by adding the key in both locales, never a place to put copy.
 */
export function makeEnumLabel(locale: Locale): EnumLabel {
  const labels: Readonly<Record<string, string>> = getMessages(locale).visits.enum;
  return value => labels[value] ?? humaniseEnum(value, locale);
}
