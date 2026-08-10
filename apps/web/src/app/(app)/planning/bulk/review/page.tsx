import Shell from "@/components/Shell";
import StatusPill from "@/components/saqeel/status-pill/status-pill";
import ReviewAccessState from "@/components/sections/planning-bulk/review-access-state/review-access-state";
import ReviewScreen from "@/components/sections/planning-bulk/review-screen/review-screen";
import { loadBulkReview } from "@/features/planning-bulk/queries";
import { buildReviewScreenStrings } from "@/features/planning-bulk/review-strings";
import { useT } from "@/lib/i18n";

export default async function BulkReview({ searchParams }: { searchParams: Promise<{ plan?: string }> }) {
  const { plan } = await searchParams;
  const { locale } = await useT();
  const strings = buildReviewScreenStrings(locale);
  const review = await loadBulkReview(plan);

  return (
    <Shell
      current="/planning"
      title={strings.title}
      context={review.kind === "ready" ? <StatusPill tone="info">{strings.context}</StatusPill> : undefined}
    >
      {review.kind === "ready"
        ? <ReviewScreen
          draft={review.draft}
          draftUnavailable={review.draftUnavailable}
          transitionsExecutable={review.transitionsExecutable}
        />
        : <ReviewAccessState kind={review.kind} />}
    </Shell>
  );
}
