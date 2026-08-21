import type { StatusTone } from "@/components/saqeel/status-pill/status-pill";
import type { Messages } from "@/i18n/messages";
import { formatDate } from "@/lib/dates";
import type { Locale } from "@/lib/i18n";
import { humaniseEnum } from "@/lib/text";

export type CrStrings = Messages["factoriesCr"];

export type SourceState = { readonly label: string; readonly tone: StatusTone };

export type CrFormatters = {
  readonly text: (value: unknown) => string;
  readonly dt: (value: string | null | undefined) => string;
  readonly label: (value: string | null | undefined) => string;
  readonly amount: (value: number | null | undefined) => string;
  readonly sourceState: (error: unknown, value: unknown, queried?: boolean) => SourceState;
};

const EMPTY = "—";

export function makeCrFormatters(locale: Locale, strings: CrStrings): CrFormatters {
  const enumMap = strings.enum as Record<string, string>;
  const numbers = new Intl.NumberFormat(locale === "ar" ? "ar-SA" : "en-GB");

  const text = (value: unknown) =>
    value === null || value === undefined || value === "" ? EMPTY : String(value);

  const dt = (value: string | null | undefined) => (value ? formatDate(value, locale) : EMPTY);

  const label = (value: string | null | undefined) => {
    if (!value) return EMPTY;
    return enumMap[value] ?? humaniseEnum(value, locale);
  };

  const amount = (value: number | null | undefined) =>
    value === null || value === undefined ? EMPTY : numbers.format(value);

  const sourceState = (error: unknown, value: unknown, queried = true): SourceState => {
    if (error) return { label: strings.source.degraded, tone: "warning" };
    if (!queried) return { label: strings.source.notAvailable, tone: "neutral" };
    const empty = value === null || value === undefined || (Array.isArray(value) && value.length === 0);
    if (empty) return { label: strings.source.empty, tone: "neutral" };
    return { label: strings.source.available, tone: "success" };
  };

  return { text, dt, label, amount, sourceState };
}

export function reconciliationTone(role: string): StatusTone {
  if (role === "authoritative") return "success";
  if (role === "contract_unverified") return "warning";
  if (role === "conflicting") return "danger";
  if (role === "permission_restricted" || role === "unavailable") return "neutral";
  return "info";
}

export function crTitle(cr: { legal_name_en: string | null; legal_name_ar: string | null; legal_name: string | null; cr_number: string }, locale: Locale): string {
  const primary = locale === "ar"
    ? cr.legal_name_ar ?? cr.legal_name ?? cr.legal_name_en
    : cr.legal_name_en ?? cr.legal_name ?? cr.legal_name_ar;
  return primary ?? cr.cr_number;
}

export function crFreshness(
  system: string | null | undefined,
  syncedAt: string | null | undefined,
  strings: CrStrings,
  locale: Locale,
): string {
  const source = system ?? "—";
  const synced = syncedAt ? formatDate(syncedAt, locale) : "—";
  return `${strings.meta.source} ${source} · ${strings.meta.recorded} ${synced}`;
}
