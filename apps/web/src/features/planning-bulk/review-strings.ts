import { getMessages } from "@/i18n/messages";
import type { Locale } from "@/lib/i18n";
import type { ReviewStrings } from "@/app/(app)/planning/bulk/review/ReviewClient";

export type BulkReviewMessages = ReturnType<typeof bulkReviewMessages>;

export function bulkReviewMessages(locale: Locale) {
  return getMessages(locale).planning.bulkReview;
}

export function buildReviewScreenStrings(locale: Locale): { title: string; context: string } {
  const review = bulkReviewMessages(locale);
  return { title: review.title, context: review.context };
}

export function buildReviewAccessStrings(locale: Locale): BulkReviewMessages["access"] {
  return bulkReviewMessages(locale).access;
}

export function buildReviewStrings(locale: Locale): ReviewStrings {
  return bulkReviewMessages(locale);
}
