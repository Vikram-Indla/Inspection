import { useT } from "@/lib/i18n";
import Button from "@/components/saqeel/button/button";
import EmptyState from "@/components/saqeel/empty-state/empty-state";
import PlanningNotice from "@/components/sections/planning-single/planning-notice/planning-notice";
import { buildReviewAccessStrings } from "@/features/planning-bulk/review-strings";

export type ReviewAccessKind = "denied" | "unauthorized";

export default async function ReviewAccessState({ kind }: { kind: ReviewAccessKind }) {
  const { locale } = await useT();
  const strings = buildReviewAccessStrings(locale);

  if (kind === "denied") {
    return <PlanningNotice tone="danger" label={strings.unavailableTag}>{strings.unavailableBody}</PlanningNotice>;
  }

  return (
    <EmptyState
      icon="restricted"
      tone="warning"
      title={strings.unauthorizedTitle}
      description={strings.unauthorizedBody}
      action={<Button variant="secondary" href="/planning">{strings.unauthorizedBack}</Button>}
    />
  );
}
