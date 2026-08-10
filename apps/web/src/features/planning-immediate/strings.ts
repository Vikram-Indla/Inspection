import { getMessages } from "@/i18n/messages";
import type { Locale } from "@/lib/i18n";
import type { AuthorityStrings } from "./authority";

export type ImmediateMessages = ReturnType<typeof immediateMessages>;

export type ImmediateScreenStrings = {
  readonly title: string;
  readonly context: string;
  readonly handoff: string;
  readonly identityNoticeTitle: string;
  readonly identityNoticeBody: string;
};

export function immediateMessages(locale: Locale) {
  return getMessages(locale).planning.immediate;
}

export function buildImmediateScreenStrings(locale: Locale): ImmediateScreenStrings {
  const { title, context, handoff, identityNoticeTitle, identityNoticeBody } = immediateMessages(locale);
  return { title, context, handoff, identityNoticeTitle, identityNoticeBody };
}

export function buildAuthorityStrings(locale: Locale): AuthorityStrings {
  return immediateMessages(locale).authority;
}

export function buildHandoffLabel(locale: Locale, cr: string, license: string): string {
  return immediateMessages(locale).handoff.replace("{cr}", cr).replace("{license}", license);
}
