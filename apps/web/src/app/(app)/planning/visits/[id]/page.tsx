import Shell from "@/components/Shell";
import EmptyState from "@/components/EmptyState";
import { IconBlocked } from "@/app/icons";
import PlanningReadFailureState from "@/components/PlanningReadFailure";
import { supabaseServer } from "@/lib/supabase-server";
import { getPlanningReadContract } from "@/lib/planning/read-contract";
import { useT } from "@/lib/i18n";
import VisitDetail from "../../../visits/[id]/page";

export const dynamic = "force-dynamic";

export default async function PlanningVisitDetail({ params, searchParams }: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ created?: string; focus?: string }>;
}) {
  const sp = await searchParams;
  const { t, locale } = await useT();
  const tr = (key: string, en: string, ar: string) => locale === "ar" ? ar : t(key, en);
  const title = t("visit.detail.title", "Visit details");
  const sb = await supabaseServer();
  const { id } = await params;
  const contract = await getPlanningReadContract<{ visit_id: string }>(sb, "visit_detail", id);

  if (!contract.ok && contract.kind === "contract_gap") {
    return (
      <Shell current="/planning" title={title}>
        <PlanningReadFailureState
          failure={contract}
          title={t("plan.read.failure.title", "Planning access needs attention")}
          body={t("plan.read.failure.body", "Planning data is not available right now. Nothing was changed. Try again once access is fixed.")}
          referenceLabel={t("plan.read.failure.reference", "Support reference")}
          retryLabel={t("plan.read.failure.retry", "Retry")}
          retryHref={`/planning/visits/${id}`}
        />
      </Shell>
    );
  }
  if (!contract.ok && contract.kind === "not_found") {
    return (
      <Shell current="/planning" title={title}>
        <EmptyState
          glyph="∅"
          title={t("visit.detail.notFound", "Not in your scope or does not exist")}
          body={t("visit.detail.notFoundDesc", "IDs never change or get reused (FLD-VIS-001).")}
        />
      </Shell>
    );
  }
  if (!contract.ok) {
    return (
      <Shell current="/planning" title={title}>
        <EmptyState
          icon={<IconBlocked />}
          title={tr("plan.home.unauthorized.title", "You don't have permission", "ليست لديك الصلاحية اللازمة")}
          body={tr(
            "visit.detail.unauthorized.body",
            "You need planning access to view visit details.",
            "يلزم صلاحية تخطيط لعرض تفاصيل الزيارة.",
          )}
        />
      </Shell>
    );
  }

  return VisitDetail({
    params,
    searchParams: Promise.resolve({ ...sp, wa_route_base: "planning" }),
  });
}
