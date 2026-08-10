import { useT } from "@/lib/i18n";
import ErrorBoundary from "@/components/saqeel/error-boundary/error-boundary";
import ReviewClient from "@/app/(app)/planning/bulk/review/ReviewClient";
import { buildReviewStrings } from "@/features/planning-bulk/review-strings";
import { buildBoundaryStrings } from "@/features/planning-bulk/strings";
import type { BulkDraft } from "@/features/planning-bulk/queries";

export default async function ReviewScreen({ draft, draftUnavailable, transitionsExecutable }: {
  draft: BulkDraft | null;
  draftUnavailable: boolean;
  transitionsExecutable: boolean;
}) {
  const { locale } = await useT();

  return (
    <ErrorBoundary strings={buildBoundaryStrings(locale)}>
      <ReviewClient
        strings={buildReviewStrings(locale)}
        initialDraft={draft}
        draftUnavailable={draftUnavailable}
        transitionsExecutable={transitionsExecutable}
        locale={locale}
      />
    </ErrorBoundary>
  );
}
