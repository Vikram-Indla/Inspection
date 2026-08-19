import { getMessages } from "@/i18n/messages";
import { sentenceCase } from "@/lib/text";
import type { Locale } from "@/lib/i18n";
import type { EffectiveStatus } from "./types";

export type AdminDelegationMessages = ReturnType<typeof adminDelegationMessages>;

export function adminDelegationMessages(locale: Locale) {
  return getMessages(locale).adminDelegation;
}

export function delegationResultMessage(code: string, strings: AdminDelegationMessages): string {
  const map: Record<string, string> = strings.result;
  return map[code] ?? strings.result.write_failed;
}

export function statusLabel(status: EffectiveStatus, strings: AdminDelegationMessages): string {
  return strings.status[status];
}

export function effectiveDelegationStatus(
  row: { status: "active" | "revoked"; ends_at: string },
  now: number,
): EffectiveStatus {
  if (row.status === "revoked") return "revoked";
  return new Date(row.ends_at).getTime() < now ? "expired" : "active";
}

export function scopeLabel(scope: string, locale: Locale): string {
  return sentenceCase(scope, locale);
}
