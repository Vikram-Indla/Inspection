import { useT } from "@/lib/i18n";
import ReviewClient from "@/app/(app)/planning/bulk/review/ReviewClient";
import { buildReviewStrings } from "@/features/planning-bulk/review-strings";
import type { BulkDraft } from "@/features/planning-bulk/queries";

export default async function ReviewScreen({ draft, draftUnavailable, transitionsExecutable }: {
  draft: BulkDraft | null;
  draftUnavailable: boolean;
  transitionsExecutable: boolean;
}) {
  const { locale } = await useT();

  return (
    <ReviewClient
      strings={buildReviewStrings(locale)}
      initialDraft={draft}
      draftUnavailable={draftUnavailable}
      transitionsExecutable={transitionsExecutable}
      locale={locale}
    />
  );
}
