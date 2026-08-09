import Shell from "@/components/Shell";
import { supabaseServer } from "@/lib/supabase-server";
import { getVerifiedUser } from "@/lib/verified-user";
import { getLocale } from "@/lib/i18n";
import { getMessages } from "@/i18n/messages";
import { getPlanningAccess } from "@/lib/planning/access";
import CreateVisitSection from "@/components/planning/create-visit-section/create-visit-section";
import PlanningDenied from "@/components/planning/planning-denied/planning-denied";
import PlanningScreen from "@/components/planning/planning-screen/planning-screen";
import { loadPlanningWorkspace, parsePlanningParams, type PlanningSearchParams } from "@/features/planning/queries";

export const dynamic = "force-dynamic";

export default async function PlanningPage({ searchParams }: { searchParams: Promise<PlanningSearchParams> }) {
  const [sp, locale] = await Promise.all([searchParams, getLocale()]);
  const { planning } = getMessages(locale);
  const sb = await supabaseServer();
  const access = await getPlanningAccess(sb, ["planning.view", "planning.create", "planning.export", "planning.approve"]);
  if (access.error) {
    return <Shell current="/planning" title=""><PlanningDenied title={planning.denied.unavailableTitle} body={planning.denied.unavailableBody} /></Shell>;
  }
  if (access.accessClass !== "business_staff" || !access.can("planning.view")) {
    return <Shell current="/planning" title=""><PlanningDenied title={planning.denied.unauthorizedTitle} body={planning.denied.unauthorizedBody} /></Shell>;
  }
  const params = parsePlanningParams(sp);
  const { data: { user } } = await getVerifiedUser(sb);
  const workspace = await loadPlanningWorkspace(sb, params, user?.id ?? null);
  if (!workspace.ok) {
    return <Shell current="/planning" title=""><PlanningDenied title={planning.denied.unavailableTitle} body={planning.denied.unavailableBody} /></Shell>;
  }
  return (
    <Shell current="/planning" title="">
      <PlanningScreen workspace={workspace} params={params} sp={sp} locale={locale} messages={planning}
        canExport={access.can("planning.export")} canCreate={access.can("planning.create")}
        canApprove={access.can("planning.approve")} formId="planning-filter-toolbar"
        createVisit={<CreateVisitSection strings={planning.create} canCreate={access.can("planning.create")} />} />
    </Shell>
  );
}
