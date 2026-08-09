import Shell from "@/components/Shell";
import EmptyState from "@/components/saqeel/empty-state/empty-state";
import { supabaseServer } from "@/lib/supabase-server";
import { getVerifiedUser } from "@/lib/verified-user";
import { getPlanningAccess } from "@/lib/planning/access";
import { useT } from "@/lib/i18n";
import { getMessages } from "@/i18n/messages";
import type { VisitSearchParams } from "@/features/visits/params";
import Visits from "../../visits/page";

export const dynamic = "force-dynamic";

export default async function PlanningVisits({ searchParams }: { searchParams: Promise<VisitSearchParams> }) {
  const sp = await searchParams;
  const { locale } = await useT();
  const { visit } = getMessages(locale).planning;
  const sb = await supabaseServer();
  await getVerifiedUser(sb);
  const access = await getPlanningAccess(sb, ["planning.view"]);
  const denied = !["business_staff", "admin"].includes(access.accessClass) || !access.can("planning.view");

  if (access.error || denied) {
    return (
      <Shell current="/planning" title={visit.title}>
        <EmptyState
          icon={access.error ? "risk" : "restricted"}
          tone={access.error ? "danger" : "warning"}
          title={access.error ? visit.state.unavailableTitle : visit.state.unauthorizedTitle}
          description={access.error ? visit.state.unavailableBody : visit.state.unauthorizedBody}
        />
      </Shell>
    );
  }

  return Visits({ searchParams: Promise.resolve({ ...sp, wa_route_base: "planning" }) });
}
