import { getMessages, type Messages } from "@/i18n/messages";
import type { Locale } from "@/lib/i18n";

export type ReviewsStrings = Messages["reviews"];

export function buildReviewsStrings(locale: Locale): ReviewsStrings {
  return getMessages(locale).reviews;
}
