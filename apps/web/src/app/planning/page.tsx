import Shell, { preloadShell } from "@/components/Shell";
import { getServerUser, supabaseServer } from "@/lib/supabase-server";
import { getUserRoles } from "@/lib/persona";
import { useT } from "@/lib/i18n";
import EmptyState from "@/components/EmptyState";

export const dynamic = "force-dynamic";

export default async function PlanningHome() {
  preloadShell("/planning");
  const { t, locale } = await useT();
  const tr = (key: string, en: string, ar: string) => locale === "ar" ? ar : t(key, en);
  const sb = await supabaseServer();
  const { data: { user } } = await getServerUser();
  const { data: myRoles, error: rolesError } = user
    ? await getUserRoles(user.id)
    : { data: [] as { role_key: string }[], error: null };
  const isPlanner = !rolesError && (myRoles ?? []).some(r => r.role_key === "planner");
  if (!isPlanner) {
    if (rolesError) console.error("[CD-020] role lookup failed:", rolesError);
    return (
      <Shell current="/planning" title={t("plan.home.title", "Visit planning")}>
        <EmptyState glyph="⛔" title={tr("plan.home.unauthorized.title", "Authorized role required", "يلزم دور مصرح له")}
          body={tr("plan.home.unauthorized.body", "Visit Planning (SCR-WEB-100) is available to the Planner role only.", "تخطيط الزيارات (SCR-WEB-100) متاح لدور المخطط فقط.")} />
      </Shell>
    );
  }
  const today = new Date().toISOString().slice(0, 10);
  const [{ data: pkg, error: packageError }, { count: drafts, error: draftsError }] = await Promise.all([
    sb.from("package_versions").select("id").in("status", ["published", "locked"])
      .lte("effective_from", today).or(`effective_to.is.null,effective_to.gte.${today}`).limit(1),
    sb.from("visit_plans").select("id", { count: "exact", head: true }).eq("status", "draft"),
  ]);
  if (packageError || draftsError) {
    console.error("[CD-020] planning-home read failed:", packageError ?? draftsError);
    return (
      <Shell current="/planning" title={t("plan.home.title", "Visit planning")}>
        <EmptyState glyph="⚠" title={tr("plan.home.unavailable.title", "Planning data unavailable", "بيانات التخطيط غير متاحة")}
          body={tr("plan.home.unavailable.body", "The planning workspace could not be loaded (ERR-OPS-001). Nothing was created or changed. Try again.", "تعذر تحميل مساحة التخطيط (ERR-OPS-001). لم يتم إنشاء أو تغيير أي بيانات. أعد المحاولة.")} />
      </Shell>
    );
  }
  const noPackage = (pkg ?? []).length === 0;
  const methods = [
    ["▦", t("plan.method.bulk.title", "Bulk planning"), t("plan.method.bulk.desc", "AND/OR criteria over the factory master; many visits under one plan (M01-002)."), "/planning/bulk"],
    ["▣", t("plan.method.single.title", "Single visit"), t("plan.method.single.desc", "One registered factory via CR / Industrial License; one plan, one visit (M01-034/042)."), "/planning/single"],
    ["⚡", t("plan.method.immediate.title", "Immediate visit"), t("plan.method.immediate.desc", "Urgent dispatch; unregistered factory allowed with mandatory location (M01-045/046)."), "/planning/immediate"],
  ] as const;
  return (
    <Shell current="/planning" title={t("plan.home.title", "Visit planning")}
      context={<span className="ax-caption ax-numeric">{t("plan.home.drafts", "{n} drafts").replace("{n}", String(drafts ?? 0))}</span>}>
      {noPackage && (
        <div className="ax-banner ax-banner--critical"><div>
          <strong>{t("plan.home.noPackage", "No published inspection package.")}</strong> {t("plan.home.noPackageDesc", "Planning cannot publish without one (ERR-PUB-001).")} <a className="ax-link" href="/admin">{t("plan.home.openAdmin", "Open Admin")}</a>.
        </div></div>
      )}
      <div className="web-methods" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))", gap: "var(--ax-space-300)" }}>
        {methods.map(([glyph, title, desc, href]) => {
          const content = <><span style={{ fontSize: 22 }}>{glyph}</span><h3>{title}</h3><p className="ax-caption">{desc}</p></>;
          const style = { padding: "var(--ax-space-400)", display: "flex", flexDirection: "column" as const, gap: "var(--ax-space-150)", textDecoration: "none", color: "inherit", opacity: noPackage ? .55 : 1 };
          return noPackage
            ? <div key={href} className="ax-surface ax-panel" aria-disabled="true" style={style}>{content}</div>
            : <a key={href} href={href} className="ax-surface ax-panel" style={style}>{content}</a>;
        })}
      </div>
      <p className="ax-caption">{t("plan.home.oneMethod", "One planning method per creation session (M01-011 · REF-001).")}</p>
      {(drafts ?? 0) > 0 && <div className="ax-banner ax-banner--warning"><div>
        <strong>{tr("plan.home.draftReview.title", "Draft plans need review", "توجد خطط مسودة تحتاج إلى مراجعة")}</strong>{" "}
        {tr("plan.home.draftReview.body", "Open the plan register to inspect them. Editable resume remains unavailable until the governed draft route is reconciled.", "افتح سجل الخطط لمراجعتها. تظل متابعة التحرير غير متاحة حتى تتم مواءمة مسار المسودة المعتمد.")}{" "}
        <a className="ax-link" href="/planning/plans">{tr("plan.home.draftReview.link", "Open plan register", "فتح سجل الخطط")}</a>
      </div></div>}
      {/* FIX WAVE F4 — M02-035 plan register entry point */}
      <p><a className="ax-link" href="/planning/plans">{t("plan.home.registerLink", "Plan register — status, child visits and progress of every plan (M02-035) →")}</a></p>
    </Shell>
  );
}
