import ReviewDetailSkeleton from "@/components/sections/review-detail/review-detail-skeleton/review-detail-skeleton";
import { buildReviewsStrings } from "@/features/reviews/strings";
import { getLocale } from "@/lib/i18n";

export default async function Loading() {
  return <ReviewDetailSkeleton label={buildReviewsStrings(await getLocale()).loading} />;
}
