import ReviewsSkeleton from "@/components/sections/reviews/reviews-skeleton/reviews-skeleton";
import { buildReviewsStrings } from "@/features/reviews/strings";
import { getLocale } from "@/lib/i18n";

export default async function Loading() {
  return <ReviewsSkeleton label={buildReviewsStrings(await getLocale()).loading} />;
}
