import { useT } from "@/lib/i18n";
import EmptyState from "@/components/saqeel/empty-state/empty-state";
import PlanningNotice from "@/components/sections/planning-single/planning-notice/planning-notice";
import { buildAccessStrings } from "@/features/planning-bulk/strings";

export type BulkAccessKind = "denied" | "unauthorized" | "unavailable";

export default async function BulkAccessState({ kind }: { kind: BulkAccessKind }) {
  const { locale } = await useT();
  const strings = buildAccessStrings(locale);

  if (kind === "denied") {
    return <PlanningNotice tone="danger" label={strings.deniedTag}>{strings.deniedBody}</PlanningNotice>;
  }

  if (kind === "unauthorized") {
    return (
      <EmptyState
        icon="restricted"
        tone="warning"
        title={strings.unauthorizedTitle}
        description={strings.unauthorizedBody}
      />
    );
  }

  return (
    <EmptyState
      icon="risk"
      tone="danger"
      title={strings.unavailableTitle}
      description={strings.unavailableBody}
    />
  );
}
