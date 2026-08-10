import Shell from "@/components/Shell";
import StatusPill from "@/components/saqeel/status-pill/status-pill";
import BulkAccessState from "@/components/sections/planning-bulk/bulk-access-state/bulk-access-state";
import BulkScreen from "@/components/sections/planning-bulk/bulk-screen/bulk-screen";
import { loadBulkTargeting } from "@/features/planning-bulk/queries";
import { buildScreenStrings } from "@/features/planning-bulk/strings";
import type { BulkCriteriaParams } from "@/features/planning-bulk/targeting";
import { useT } from "@/lib/i18n";

export default async function BulkPlanning({ searchParams }: { searchParams: Promise<BulkCriteriaParams> }) {
  const params = await searchParams;
  const { locale } = await useT();
  const strings = buildScreenStrings(locale);
  const targeting = await loadBulkTargeting();

  return (
    <Shell
      current="/planning"
      title={strings.title}
      context={targeting.kind === "ready" ? <StatusPill tone="info">{strings.context}</StatusPill> : undefined}
    >
      {targeting.kind === "ready"
        ? <BulkScreen params={params} factories={targeting.factories} />
        : <BulkAccessState kind={targeting.kind} />}
    </Shell>
  );
}
