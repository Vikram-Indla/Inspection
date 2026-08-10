import Shell from "@/components/Shell";
import StatusPill from "@/components/saqeel/status-pill/status-pill";
import SingleAccessState from "@/components/sections/planning-single/single-access-state/single-access-state";
import SingleVisitScreen from "@/components/sections/planning-single/single-visit-screen/single-visit-screen";
import { loadSinglePlanning, type SinglePlanningParams } from "@/features/planning-single/queries";
import { buildSingleVisitStrings } from "@/features/planning-single/strings";
import { useT } from "@/lib/i18n";

export const dynamic = "force-dynamic";

export default async function SinglePlanning({ searchParams }: { searchParams: Promise<SinglePlanningParams> }) {
  const params = await searchParams;
  const { t, locale } = await useT();
  const strings = buildSingleVisitStrings(t);
  const planning = await loadSinglePlanning(params);

  return (
    <Shell
      current="/planning"
      title={strings.title}
      context={planning.kind === "ready" ? <StatusPill tone="info">{strings.context}</StatusPill> : undefined}
    >
      {planning.kind === "ready"
        ? <SingleVisitScreen data={planning.data} strings={strings} locale={locale} />
        : <SingleAccessState state={planning} />}
    </Shell>
  );
}
