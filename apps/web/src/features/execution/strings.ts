import { getMessages } from "@/i18n/messages";
import type { Locale } from "@/lib/i18n";

export type ExecutionMessages = ReturnType<typeof executionMessages>;

export function executionMessages(locale: Locale) {
  return getMessages(locale).execution;
}

export function buildLoadingStrings(locale: Locale): ExecutionMessages["loading"] {
  return executionMessages(locale).loading;
}

export function buildErrorStrings(locale: Locale): ExecutionMessages["error"] {
  return executionMessages(locale).error;
}

export function buildDeniedStrings(locale: Locale): ExecutionMessages["denied"] {
  return executionMessages(locale).denied;
}

export function buildEmptyStrings(locale: Locale): ExecutionMessages["empty"] {
  return executionMessages(locale).empty;
}

export function buildNoticeStrings(locale: Locale): ExecutionMessages["notice"] {
  return executionMessages(locale).notice;
}

export function buildJourneyStrings(locale: Locale): ExecutionMessages["journey"] {
  return executionMessages(locale).journey;
}

export function buildScreenStrings(locale: Locale): { title: string } {
  return { title: executionMessages(locale).title };
}
