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
          title={tr("visit.list.unavailable.title", "Visits not available", "الزيارات غير متاحة")}
          body={tr("visit.list.loadErrorNeutral", "Visits are not available right now. Please try again.", "الزيارات غير متاحة حاليًا. حاول مرة أخرى.")}
        />
      </Shell>
    );
  }
  if (!["business_staff", "admin"].includes(access.accessClass) || !access.can("planning.view")) {
    return (
      <Shell current="/planning" title={title}>
        <EmptyState
          glyph="⛔"
          title={tr("plan.home.unauthorized.title", "You don't have permission", "ليست لديك الصلاحية اللازمة")}
          body={tr(
            "visit.list.unauthorized.body",
            "You need planning access to manage visits.",
            "يلزم صلاحية تخطيط لإدارة الزيارات.",
          )}
        />
      </Shell>
    );
  }

  return Visits({
    searchParams: Promise.resolve({ ...sp, wa_route_base: "planning" }),
  });
}
