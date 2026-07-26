import Shell from "@/components/Shell";
import EmptyState from "@/components/EmptyState";
import { supabaseServer } from "@/lib/supabase-server";
import { getVerifiedUser } from "@/lib/verified-user";
import { useT } from "@/lib/i18n";
import { getPlanningAccess } from "@/lib/planning/access";
import PlanningPreview from "./PlanningPreview";

export const dynamic = "force-dynamic";

type DraftRow = {
  id: string;
  method: string;
  status: string;
  plan_reference: string | null;
  created_at: string;
  profiles: { full_name: string } | null;
};

const continueHref = (draft: DraftRow) =>
  draft.method === "bulk"
    ? `/planning/bulk/review?plan=${draft.id}`
    : draft.method === "single"
      ? `/planning/single?plan=${draft.id}`
      : `/planning/immediate?plan=${draft.id}`;

// PKT-RESPONSIVE-PLANNING-003 · WA-DES-036
// The approved Planning landing is canonical at /planning. Its role boundary
// is resolved before any planning data read:
// - business_staff with planning.view receives all creation methods plus
//   RLS-scoped drafts and the effective package state;
// - Inspector receives only the explicitly authorized Immediate method;
// - administration/anonymous classes fail closed.
export default async function PlanningHome() {
  const { t, locale } = await useT();
  const tr = (key: string, en: string, ar: string) => locale === "ar" ? ar : t(key, en);
  const title = t("plan.home.title", "Visit planning");
  const sb = await supabaseServer();
  await getVerifiedUser(sb);
  const access = await getPlanningAccess(sb, [
    "planning.view",
    "planning.create",
    "planning.create.immediate",
  ]);

  const unavailable = () => (
    <Shell current="/planning" title={title}>
      <EmptyState
        glyph="⚠"
        title={tr("plan.home.unavailable.title", "Planning data unavailable", "بيانات التخطيط غير متاحة")}
        body={tr(
          "plan.home.unavailable.body",
          "The planning workspace could not be loaded (ERR-OPS-001). Nothing was created or changed. Try again.",
          "تعذر تحميل مساحة التخطيط (ERR-OPS-001). لم يتم إنشاء أو تغيير أي بيانات. أعد المحاولة.",
        )}
      />
    </Shell>
  );
  const unauthorized = () => (
    <Shell current="/planning" title={title}>
      <EmptyState
        glyph="⛔"
        title={tr("plan.home.unauthorized.title", "Authorized role required", "يلزم دور مصرح له")}
        body={tr(
          "plan.home.unauthorized.body",
          "Visit Planning is restricted to authorized planning capabilities.",
          "تخطيط الزيارات مقيّد بصلاحيات التخطيط المصرح بها.",
        )}
      />
    </Shell>
  );

  if (access.error) return unavailable();

  const methods = {
    bulk: {
      title: t("plan.method.bulk.title", "Plan multiple visits"),
      desc: t("plan.method.bulk.desc", "AND/OR criteria over the Factory list; many visits under one plan (M01-002)."),
      href: "/planning/bulk",
    },
    single: {
      title: t("plan.method.single.title", "Plan one visit"),
      desc: t("plan.method.single.desc", "One registered factory via CR / Industrial License; one plan, one visit (M01-034/042)."),
      href: "/planning/single",
    },
    immediate: {
      title: t("plan.method.immediate.title", "Create an urgent visit"),
      desc: t("plan.method.immediate.desc", "Registered or unregistered factory with mandatory location (M01-043/045/046)."),
      href: "/planning/immediate",
    },
  };

  if (access.accessClass === "inspector") {
    if (!access.can("planning.create.immediate")) return unauthorized();
    return (
      <Shell
        current="/planning"
        title={title}
        context={<span className="ax-caption ax-numeric">CR-001 · CR-043..CR-051 · WA-DES-036</span>}
      >
        <PlanningPreview
          methods={[methods.immediate]}
          drafts={[]}
          effectivePackage={undefined}
          canCreate
          locale={locale}
          showVisits={false}
          showPlans={false}
        />
      </Shell>
    );
  }

  if (access.accessClass !== "business_staff" || !access.can("planning.view")) {
    return unauthorized();
  }

  const today = new Date().toISOString().slice(0, 10);
  const [packageRead, draftsRead] = await Promise.all([
    sb.from("package_versions")
      .select("id, version_label, packages(title)")
      .in("status", ["published", "locked"])
      .lte("effective_from", today)
      .or(`effective_to.is.null,effective_to.gte.${today}`)
      .order("published_at", { ascending: false, nullsFirst: false })
      .limit(1),
    sb.from("visit_plans")
      .select("id, method, status, plan_reference, created_at, profiles(full_name)")
      .in("status", ["draft", "validated"])
      .is("archived_at", null)
      .order("created_at", { ascending: false })
      .limit(10),
  ]);

  if (packageRead.error || draftsRead.error) {
    console.error("[planning.home] canonical landing read failed:", packageRead.error?.message ?? draftsRead.error?.message);
    return unavailable();
  }

  const effectivePackage = ((packageRead.data ?? []) as unknown as {
    version_label: string;
    packages: { title: string } | null;
  }[])[0];
  const drafts = (draftsRead.data ?? []) as unknown as DraftRow[];

  return (
    <Shell
      current="/planning"
      title={title}
      context={<span className="ax-caption ax-numeric">CR-001..CR-098 · WA-DES-036</span>}
    >
      <PlanningPreview
        methods={[methods.bulk, methods.single, methods.immediate]}
        drafts={drafts.map(draft => ({
          id: draft.id,
          method: t(`enum.${draft.method}`, draft.method),
          status: t(`enum.${draft.status}`, draft.status),
          planReference: draft.plan_reference,
          createdAt: draft.created_at,
          planner: draft.profiles?.full_name ?? "—",
          href: continueHref(draft),
        }))}
        effectivePackage={effectivePackage
          ? `${effectivePackage.packages?.title ?? "—"} · ${effectivePackage.version_label}`
          : null}
        canCreate={access.can("planning.create")}
        locale={locale}
      />
    </Shell>
  );
}
