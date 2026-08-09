import Shell from "@/components/Shell";
import EmptyState from "@/components/saqeel/empty-state/empty-state";
import VisitManagementScreen from "@/components/sections/visits/visit-management-screen/visit-management-screen";
import VisitAiSummary from "@/components/sections/visits/visit-ai-summary/visit-ai-summary";
import { supabaseServer } from "@/lib/supabase-server";
import { useT } from "@/lib/i18n";
import { getMessages } from "@/i18n/messages";
import { parseVisitParams, type VisitSearchParams } from "@/features/visits/params";
import { queryVisitManagement } from "@/features/visits/queries";

export const dynamic = "force-dynamic";

export default async function Visits({ searchParams }: { searchParams: Promise<VisitSearchParams> }) {
  const sp = await searchParams;
  const planningOwned = sp.wa_route_base === "planning";
  const routeBase = planningOwned ? "/planning/visits" : "/visits";
  const { locale } = await useT();
  const { visit } = getMessages(locale).planning;
  const params = parseVisitParams(sp);
  const data = await queryVisitManagement(await supabaseServer(), params);

  return (
    <Shell current={planningOwned ? "/planning" : "/visits"} title={visit.title}>
      {data === null ? (
        <EmptyState icon="risk" tone="danger"
          title={visit.state.unavailableTitle} description={visit.state.unavailableBody} />
      ) : (
        <VisitManagementScreen
          data={data} params={params} sp={sp} routeBase={routeBase}
          planningHref={planningOwned ? null : "/planning"}
          aiPanel={planningOwned ? null : <VisitAiSummary locale={locale} />}
        />
      )}
    </Shell>
  );
}
