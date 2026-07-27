import Shell from "@/components/Shell";
import EmptyState from "@/components/EmptyState";
import { supabaseServer } from "@/lib/supabase-server";
import { getVerifiedUser } from "@/lib/verified-user";
import { getPlanningAccess } from "@/lib/planning/access";
import { useT } from "@/lib/i18n";
import Visits from "../../visits/page";

export const dynamic = "force-dynamic";

export default async function PlanningVisits({ searchParams }: {
  searchParams: Promise<{ limit?: string }>;
}) {
  const sp = await searchParams;
  const { t, locale } = await useT();
  const tr = (key: string, en: string, ar: string) => locale === "ar" ? ar : t(key, en);
  const title = t("visit.list.title", "Visit management");
  const sb = await supabaseServer();
  await getVerifiedUser(sb);
  const access = await getPlanningAccess(sb, ["planning.view"]);

  if (access.error) {
    return (
      <Shell current="/planning" title={title}>
        <EmptyState
          glyph="⚠"
          title={tr("visit.list.unavailable.title", "Visits unavailable", "الزيارات غير متاحة")}
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
            "visit.list.unauthorized.body",
            "Planning-owned visit management requires an authorized planning capability.",
            "تتطلب إدارة الزيارات التابعة للتخطيط صلاحية تخطيط مصرحاً بها.",
          )}
        />
      </Shell>
    );
  }

  return Visits({
    searchParams: Promise.resolve({ ...sp, wa_route_base: "planning" }),
  });
}
