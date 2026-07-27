import Shell from "@/components/Shell";
import EmptyState from "@/components/EmptyState";
import { supabaseServer } from "@/lib/supabase-server";
import { getVerifiedUser } from "@/lib/verified-user";
import { getPlanningAccess } from "@/lib/planning/access";
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
  await getVerifiedUser(sb);
  const access = await getPlanningAccess(sb, ["planning.view"]);

  if (access.error) {
    return (
      <Shell current="/planning" title={title}>
        <EmptyState
          glyph="⚠"
          title={tr("visit.detail.unavailable.title", "Visit unavailable", "الزيارة غير متاحة")}
          body={tr("visit.list.loadErrorNeutral", "Visits are temporarily unavailable. Please try again.", "الزيارات غير متاحة مؤقتاً. حاول مرة أخرى.")}
        />
      </Shell>
    );
  }
  if (access.accessClass !== "business_staff" || !access.can("planning.view")) {
    return (
      <Shell current="/planning" title={title}>
        <EmptyState
          glyph="⛔"
          title={tr("plan.home.unauthorized.title", "Authorized role required", "يلزم دور مصرح له")}
          body={tr(
            "visit.detail.unauthorized.body",
            "Planning-owned visit details require an authorized planning capability.",
            "تتطلب تفاصيل الزيارة التابعة للتخطيط صلاحية تخطيط مصرحاً بها.",
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
