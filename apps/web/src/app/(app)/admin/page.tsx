import type { ReactNode } from "react";
import Shell from "@/components/Shell";
import { supabaseServer } from "@/lib/supabase-server";
import { getVerifiedUser } from "@/lib/verified-user";
import { useT } from "@/lib/i18n";
import { buildShellNavigation } from "@/lib/shell-navigation";

// CD-004 / SCR-ADM-001 — Approval & Configuration home (Configuration Evidence Spine).
// Read-only control-plane gateway: it models each of the six configuration reads
// independently (verified-with-count / verified-zero / unavailable) and never
// infers platform health, thresholds, or any value outside DATA_TRUTH_LEDGER.
// A failed read is "count unknown, not zero" — verified-zero and unavailable stay
// distinct. No approve/publish/edit affordance lives here; every family links to the
// module that owns its authorization. Route-guard enforcement (W03), per-source retry
// (W10) and the proposed provenance/draft-queue reads remain HANDOFF_BLOCKED and are
// intentionally not implemented here.
export const dynamic = "force-dynamic";

type Res = { error: unknown; count: number | null };
const ok = (r: Res) => !r.error;

type ControlCard = {
  glyph: string;
  titleEn: string;
  titleAr: string;
  descEn: string;
  descAr: string;
  href: string;
  roles?: readonly string[];
};
type ControlGroup = {
  titleEn: string;
  titleAr: string;
  cards: readonly ControlCard[];
};

const CONTROL_GROUPS: readonly ControlGroup[] = [
  {
    titleEn: "People & access",
    titleAr: "المستخدمون والصلاحيات",
    cards: [
      { glyph: "Us", titleEn: "Users", titleAr: "المستخدمون", descEn: "Assign people to governed roles and review access.", descAr: "إسناد المستخدمين إلى الأدوار المحكومة ومراجعة الوصول.", href: "/admin/access", roles: ["security_admin"] },
      { glyph: "Ro", titleEn: "Roles", titleAr: "الأدوار", descEn: "Review role capabilities and governed grants.", descAr: "مراجعة قدرات الأدوار والمنح المحكومة.", href: "/admin/access?view=roles", roles: ["security_admin"] },
      { glyph: "Ac", titleEn: "Security & Access Review", titleAr: "مراجعة الأمن والوصول", descEn: "Purpose-bound grants and access oversight.", descAr: "المنح محددة الغرض والرقابة على الوصول.", href: "/admin/security-access", roles: ["security_admin"] },
    ],
  },
  {
    titleEn: "Inspection rules & forms",
    titleAr: "قواعد ونماذج التفتيش",
    cards: [
      { glyph: "Ru", titleEn: "Inspection Rules", titleAr: "قواعد التفتيش", descEn: "Regulations, clauses and linked inspection items.", descAr: "اللوائح والبنود وعناصر التفتيش المرتبطة.", href: "/admin/regulations", roles: ["compliance_admin"] },
      { glyph: "It", titleEn: "Inspection Items", titleAr: "بنود التفتيش", descEn: "Response, evidence and violation rules.", descAr: "قواعد الاستجابة والأدلة والمخالفات.", href: "/admin/items", roles: ["compliance_admin", "form_admin"] },
      { glyph: "Fm", titleEn: "Inspection Forms", titleAr: "نماذج التفتيش", descEn: "Checklist packages and immutable published versions.", descAr: "حزم قوائم التحقق والإصدارات المنشورة غير القابلة للتغيير.", href: "/admin/packages", roles: ["form_admin", "compliance_admin"] },
      { glyph: "Vn", titleEn: "Violations & Penalties", titleAr: "المخالفات والعقوبات", descEn: "Violation codes and governed penalty mappings.", descAr: "رموز المخالفات وربط العقوبات المحكوم.", href: "/admin/violations", roles: ["compliance_admin"] },
    ],
  },
  {
    titleEn: "Scoring & intelligence",
    titleAr: "التقييم والذكاء",
    cards: [
      { glyph: "Rk", titleEn: "Risk Settings", titleAr: "إعدادات المخاطر", descEn: "Versioned risk models and policy-held settings.", descAr: "نماذج مخاطر ذات إصدارات وإعدادات خاضعة للسياسة.", href: "/admin/risk", roles: ["risk_owner"] },
      { glyph: "AI", titleEn: "AI Insights", titleAr: "رؤى الذكاء الاصطناعي", descEn: "Advisory dockets with mandatory human disposition.", descAr: "ملفات استشارية تتطلب قراراً بشرياً.", href: "/ai/suggestions" },
      { glyph: "KP", titleEn: "Dashboard KPIs", titleAr: "مؤشرات لوحة القيادة", descEn: "Metric definitions, formulae and delivery state.", descAr: "تعريفات المؤشرات وصيغها وحالة إتاحتها.", href: "/admin/dashboard-config", roles: ["compliance_admin"] },
    ],
  },
  {
    titleEn: "Operations setup",
    titleAr: "إعداد العمليات",
    cards: [
      { glyph: "Wf", titleEn: "Workflow Settings", titleAr: "إعدادات سير العمل", descEn: "Versioned lifecycle transitions and guarded publication.", descAr: "انتقالات دورة الحياة ذات الإصدارات والنشر المحكوم.", href: "/admin/workflows", roles: ["workflow_admin"] },
      { glyph: "Ex", titleEn: "Execution Settings", titleAr: "إعدادات التنفيذ", descEn: "Capacity, visit modes, evidence and offline policy.", descAr: "السعة وأنماط الزيارة وسياسة الأدلة والعمل دون اتصال.", href: "/admin/execution" },
      { glyph: "Nt", titleEn: "Notification Settings", titleAr: "إعدادات الإشعارات", descEn: "Channels, rule versions and delivery testing.", descAr: "القنوات وإصدارات القواعد واختبار التسليم.", href: "/admin/notifications" },
      { glyph: "Mp", titleEn: "Map Settings", titleAr: "إعدادات الخريطة", descEn: "Governed geofence settings and spatial layers.", descAr: "إعدادات السياج الجغرافي والطبقات المكانية المحكومة.", href: "/admin/gis", roles: ["gis_admin"] },
      { glyph: "Cx", titleEn: "System Connections", titleAr: "اتصالات النظام", descEn: "Endpoint contracts and fail-closed dependency truth.", descAr: "عقود نقاط التكامل وحقيقة الاعتماد الآمنة.", href: "/admin/integrations", roles: ["security_admin", "workflow_admin"] },
      { glyph: "Dv", titleEn: "Trusted Devices", titleAr: "الأجهزة الموثوقة", descEn: "Registered field devices and trust status.", descAr: "أجهزة الميدان المسجلة وحالة الثقة.", href: "/admin/devices", roles: ["security_admin"] },
    ],
  },
  {
    titleEn: "Records & oversight",
    titleAr: "السجلات والرقابة",
    cards: [
      { glyph: "Ap", titleEn: "Awaiting Approval", titleAr: "بانتظار الاعتماد", descEn: "Configuration changes pending maker-checker review.", descAr: "تغييرات التهيئة بانتظار مراجعة المُعدّ والمراجع.", href: "/admin/compliance-approvals" },
      { glyph: "Rq", titleEn: "Configuration Requests", titleAr: "طلبات التهيئة", descEn: "Change envelopes and their review workspace.", descAr: "حزم التغيير ومساحة عمل مراجعتها.", href: "/admin/compliance-requests" },
      { glyph: "Lg", titleEn: "Activity Log", titleAr: "سجل النشاط", descEn: "Append-only audit of governed changes.", descAr: "سجل تدقيق إلحاقي للتغييرات المحكومة.", href: "/admin/audit" },
      { glyph: "Op", titleEn: "System Operations", titleAr: "عمليات النظام", descEn: "Error queue, endpoint state and feature flags.", descAr: "قائمة الأخطاء وحالة نقاط التكامل وميزات النظام.", href: "/admin/operations", roles: ["security_admin", "workflow_admin"] },
      { glyph: "Ln", titleEn: "Language & Translations", titleAr: "اللغة والترجمة", descEn: "Reference strings, coverage and revision history.", descAr: "النصوص المرجعية والتغطية وسجل المراجعات.", href: "/admin/localization", roles: ["compliance_admin", "security_admin", "workflow_admin"] },
      { glyph: "Bv", titleEn: "Issue Multiple Violations", titleAr: "إصدار عدة مخالفات", descEn: "Bulk issuance behind a permanent-write gate.", descAr: "إصدار جماعي خلف بوابة كتابة دائمة.", href: "/admin/bulk-violations", roles: ["compliance_admin"] },
      { glyph: "Er", titleEn: "Enforcement Recommendations", titleAr: "توصيات الإنفاذ", descEn: "Human decisions for enforcement recommendations.", descAr: "قرارات بشرية لتوصيات الإنفاذ.", href: "/admin/enforcement-recommendations", roles: ["compliance_admin"] },
      { glyph: "Ca", titleEn: "Violation Cases", titleAr: "قضايا المخالفات", descEn: "Case lifecycle from inspections and violations.", descAr: "دورة حياة القضايا الناتجة عن التفتيش والمخالفات.", href: "/enforcement", roles: ["compliance_admin"] },
    ],
  },
];

// Interpolate a translated template's single {slot} with a JSX node, preserving order.
function withSlot(tmpl: string, slot: string, node: ReactNode): ReactNode {
  const [before, after] = tmpl.split(`{${slot}}`);
  return (
    <>
      {before}
      {node}
      {after ?? ""}
    </>
  );
}
const fill = (tmpl: string, vars: Record<string, string | number>) =>
  Object.entries(vars).reduce((s, [k, v]) => s.split(`{${k}}`).join(String(v)), tmpl);

export default async function AdminHome() {
  const { t, locale } = await useT();
  const sb = await supabaseServer();

  const [enginesRes, regsRes, itemsRes, pkgsRes, viosRes, auditsRes] = await Promise.all([
    sb.from("engine_settings").select("engine, version_label, updated_at").order("engine"),
    sb.from("regulations").select("id", { count: "exact", head: true }),
    sb.from("inspection_items").select("id", { count: "exact", head: true }),
    sb.from("package_versions").select("id", { count: "exact", head: true }).eq("status", "published"),
    sb.from("violation_codes").select("id", { count: "exact", head: true }),
    sb.from("audit_events").select("id", { count: "exact", head: true }),
  ]);

  // Per-source failure isolation: count of the six reads that failed (W09).
  const sources: Res[] = [enginesRes, regsRes, itemsRes, pkgsRes, viosRes, auditsRes];
  const failed = sources.filter(r => !ok(r)).length;
  const total = failed === sources.length;

  // Role scope (W02 pattern): server-rendered roles → the families this user can act in.
  const { data: { user } } = await getVerifiedUser(sb);
  const { data: roleRows } = user
    ? await sb.from("user_roles").select("role_key").eq("user_id", user.id)
    : { data: [] as { role_key: string }[] };
  const roles = Array.from(new Set((roleRows ?? []).map(r => r.role_key))).sort();
  const administration = buildShellNavigation(roles).filter(g => g.id.startsWith("admin-"));
  const actFamilies = administration.flatMap(group => group.items)
    .filter(i => i.id !== "admin-home" && i.enabled)
    .map(i => t(i.labelKey, locale === "ar" ? i.labelAr : i.labelEn));
  const sep = locale === "ar" ? "، " : ", ";
  const roleLabel = roles.length ? roles.map(r => r.replace(/_/g, " ")).join(sep) : "—";
  const familiesLabel = actFamilies.length
    ? actFamilies.join(sep)
    : t("admin.overview.r2.scope.none", "none");
  const roleSet = new Set(roles);

  const engines = enginesRes.data ?? [];

  // Read-state chip: glyph + word (never colour-only). "en" carries the count-unit noun;
  // the noun has no authored Arabic in the design pack, so Arabic relies on the Family
  // column for the unit (recorded as a localization gap in the CD-004 wiring audit).
  function chip(kind: "verified" | "verifiedZero" | "unavailable") {
    const glyph = kind === "unavailable" ? "✕" : "✓";
    const cls =
      kind === "verified" ? "sq-lozenge sq-lozenge--success"
      : kind === "verifiedZero" ? "sq-lozenge sq-lozenge--info"
      : "sq-lozenge sq-lozenge--warning";
    const label =
      kind === "verified" ? t("admin.overview.r2.read.verified", "read verified")
      : kind === "verifiedZero" ? t("admin.overview.r2.read.verifiedZero", "read verified — genuinely empty")
      : t("admin.overview.r2.read.unavailable", "read failed — count unknown, not zero");
    return (
      <span className={cls}>
        <span aria-hidden="true">{glyph}</span> {label}
      </span>
    );
  }
  const num = (n: number, unitEn?: string) => (
    <span className="numeric">
      <bdi dir="ltr">{n.toLocaleString("en-US")}</bdi>
      {unitEn && locale === "en" ? ` ${unitEn}` : ""}
    </span>
  );

  // Read-result cell for a single-count family.
  function countCell(r: Res, unitEn: string, emptyHint?: string) {
    if (!ok(r)) return chip("unavailable");
    const c = r.count ?? 0;
    if (c === 0) {
      return (
        <div className="stack" style={{ gap: "var(--space-1)" }}>
          {chip("verifiedZero")}
          {emptyHint ? <span className="t-caption">{emptyHint}</span> : null}
        </div>
      );
    }
    return (
      <div className="stack" style={{ gap: "var(--space-1)" }}>
        {chip("verified")} {num(c, unitEn)}
      </div>
    );
  }

  const familyCompliance = t("admin.overview.r2.family.compliance", "Compliance Library");
  const familyPackages = t("admin.overview.r2.family.packages", "Packages & Surveys");
  const familyEnforcement = t("admin.overview.r2.family.enforcement", "Enforcement Library");
  const familyEngines = t("admin.overview.r2.family.engines", "Engine settings");
  const familyAudit = t("admin.overview.r2.family.audit", "Audit trail");
  const openTmpl = t("admin.overview.r2.open", "Open {family}");
  const openLink = (family: string, href: string) => (
    <a className="btn btn-secondary sq-link btn-touch" href={href} aria-label={`${fill(openTmpl, { family })} — ${family}`}>
      {fill(openTmpl, { family })}
    </a>
  );

  const linkOnly = [
    { href: "/admin/items", key: "shell.nav.items", en: "Inspection Items" },
    { href: "/admin/workflows", key: "shell.nav.workflows", en: "Workflow Configuration" },
    { href: "/admin/risk", key: "shell.nav.risk", en: "Risk Configuration" },
    { href: "/admin/gis", key: "shell.nav.gis", en: "GIS Configuration" },
    { href: "/admin/access", key: "shell.nav.access", en: "Users & Roles" },
    { href: "/admin/localization", key: "shell.nav.localization", en: "Localization" },
    { href: "/admin/audit", key: "shell.nav.audit", en: "Audit Trail" },
  ];

  return (
    <Shell
      current="/admin"
      title={t("admin.controlPanel.title", "Control Panel")}
      context={failed > 0 ? (
        <span className="badge badge-warning" role="status" aria-live="polite">
          <span aria-hidden="true">⚠</span>{" "}
          {fill(t("admin.overview.r2.lozenge.partial", "{n} source unavailable"), { n: failed })}
        </span>
      ) : undefined}
    >
      {/* Singleton assertive region (spec §8). Total failure is shown; a partial
          failure is announced sr-only, the visible fact living in the header lozenge. */}
      {total ? (
        <div className="sq-banner sq-banner--warning" role="alert">
          {t("admin.overview.r2.totalFailure", "Configuration sources couldn't be read. Nothing shown is current. Your session and navigation still work.")}
        </div>
      ) : failed > 0 ? (
        <div className="sr-only" role="alert">
          {fill(t("admin.overview.r2.lozenge.partial", "{n} source unavailable"), { n: failed })}
        </div>
      ) : null}

      <section
        className="stack admin-control-panel"
        aria-labelledby="admin-control-panel-heading"
        data-saqeel-design="WA-DES-020"
      >
        <div className="admin-control-panel__intro">
          <h3 id="admin-control-panel-heading" style={{ margin: 0 }}>
            {t("admin.controlPanel.heading", "Platform configuration")}
          </h3>
          <p className="t-caption" style={{ margin: 0, maxWidth: "70ch" }}>
            {t(
              "admin.controlPanel.intro",
              "Configure people, rules, forms, scoring and connections. Each area opens its governed workspace; visibility does not grant permission.",
            )}
          </p>
        </div>
        {CONTROL_GROUPS.map(group => {
          const authorizedCards = group.cards.filter(card =>
            !card.roles?.length || card.roles.some(role => roleSet.has(role)),
          );
          if (!authorizedCards.length) return null;
          const first = authorizedCards[0];
          return (
          <section className="stack admin-control-group" key={group.titleEn}>
            <div className="admin-control-grid">
              <a className="panel stack sq-link admin-control-card admin-hub-card" data-control-card
                href={first.href} style={{ textDecoration: "none", color: "inherit" }}>
                <strong>{locale === "ar" ? group.titleAr : group.titleEn}</strong>
                <span className="t-caption">
                  {fill(
                    t("admin.controlPanel.authorizedTools", "{count} authorized tools"),
                    { count: authorizedCards.length },
                  )}
                </span>
                <span className="admin-hub-card__links">
                  {authorizedCards.slice(0, 3).map(card => locale === "ar" ? card.titleAr : card.titleEn).join(locale === "ar" ? "، " : ", ")}
                </span>
              </a>
            </div>
          </section>
          );
        })}
      </section>

      <section className="panel stack" aria-labelledby="cd004-spine-h" style={{ padding: "var(--space-6)" }}>
        <h3 id="cd004-spine-h" style={{ margin: 0 }}>{t("admin.overview.r2.spine.caption", "Configuration evidence spine")}</h3>
        <div className="sq-tablewrap">
          <table className="sq-table">
            <caption className="sr-only">{t("admin.overview.r2.spine.caption", "Configuration evidence spine")}</caption>
            <thead>
              <tr>
                <th scope="col">{t("admin.overview.r2.col.family", "Family")}</th>
                <th scope="col">{t("admin.overview.r2.col.read", "Read result")}</th>
                <th scope="col">{t("admin.overview.r2.col.lifecycle", "Proven lifecycle")}</th>
                <th scope="col">{t("admin.overview.r2.col.action", "Action")}</th>
              </tr>
            </thead>
            <tbody>
              {/* Compliance Library — regulations */}
              <tr>
                <th scope="row">{familyCompliance}</th>
                <td>{countCell(regsRes, "regulations", t("admin.overview.r2.empty.compliance", "The library is genuinely empty — the read succeeded. Add the first regulation inside the module."))}</td>
                <td className="t-caption">{t("admin.overview.r2.lifecycle.regulations", "per-regulation status lives in the module; no update timestamp is read here")}</td>
                <td>{openLink(familyCompliance, "/admin/regulations")}</td>
              </tr>

              {/* Packages & Surveys — package_versions (published) + inspection_items */}
              <tr>
                <th scope="row">{familyPackages}</th>
                <td>
                  <div className="stack" style={{ gap: "var(--space-2)" }}>
                    {ok(pkgsRes) ? (
                      <span>{chip("verified")} {num(pkgsRes.count ?? 0, "published")}</span>
                    ) : chip("unavailable")}
                    {ok(itemsRes) ? (
                      <span>{chip("verified")} {num(itemsRes.count ?? 0, "items")}</span>
                    ) : chip("unavailable")}
                  </div>
                </td>
                <td className="t-caption">{t("admin.overview.r2.lifecycle.packages", "draft/published proven · distinct approver enforced · immutable once published")}</td>
                <td>{openLink(familyPackages, "/admin/packages")}</td>
              </tr>

              {/* Enforcement Library — violation_codes (no lifecycle proven on this route) */}
              <tr>
                <th scope="row">{familyEnforcement}</th>
                <td>{countCell(viosRes, "violation codes")}</td>
                <td className="t-caption" aria-hidden="true">—</td>
                <td>{openLink(familyEnforcement, "/admin/violations")}</td>
              </tr>

              {/* Engine settings — domain list + provenance (no dedicated route: data is the table) */}
              <tr>
                <th scope="row">{familyEngines}</th>
                <td>
                  {!ok(enginesRes) ? chip("unavailable")
                    : engines.length === 0 ? chip("verifiedZero")
                    : (
                      <div className="stack" style={{ gap: "var(--space-1)" }}>
                        <span>{chip("verified")} {num(engines.length, "domains")}</span>
                        <ul className="stack" style={{ gap: "2px", listStyle: "none", margin: 0, padding: 0 }}>
                          {engines.map(e => (
                            <li key={e.engine} className="t-caption">
                              <bdi dir="ltr">{e.engine}</bdi>
                              {" · "}
                              <span className="sq-version"><bdi dir="ltr">{e.version_label}</bdi></span>
                              {e.updated_at ? (
                                <> · <bdi dir="ltr" className="numeric">{new Date(e.updated_at).toISOString().slice(0, 10)}</bdi></>
                              ) : null}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                </td>
                <td className="t-caption">{t("admin.overview.r2.lifecycle.engines", "direct audited update — timestamp is provenance only")}</td>
                <td aria-hidden="true">—</td>
              </tr>

              {/* Audit trail — audit_events (no lifecycle proven on this route) */}
              <tr>
                <th scope="row">{familyAudit}</th>
                <td>{countCell(auditsRes, "events")}</td>
                <td className="t-caption" aria-hidden="true">—</td>
                <td>{openLink(familyAudit, "/admin/audit")}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <nav className="panel stack" aria-labelledby="cd004-links-h" style={{ padding: "var(--space-6)" }}>
        <h3 id="cd004-links-h" style={{ margin: 0 }}>
          {t("admin.overview.r2.linkOnly.heading", "Families this gateway reads no data for today — links only:")}
        </h3>
        <div className="row" style={{ gap: "var(--space-3)", flexWrap: "wrap" }}>
          {linkOnly.map(l => (
            <a key={l.href} className="btn btn-secondary sq-link btn-touch" href={l.href}>
              {t(l.key, l.en)}
            </a>
          ))}
        </div>
      </nav>

      <section className="panel sq-permission stack" aria-labelledby="cd004-scope-h" style={{ padding: "var(--space-6)" }}>
        <h3 id="cd004-scope-h" style={{ margin: 0 }}>
          {fill(t("admin.overview.r2.scope.heading", "Your scope — {role}"), { role: roleLabel })}
        </h3>
        <p className="t-caption" style={{ margin: 0 }}>
          {fill(
            t("admin.overview.r2.scope.body", "You can act in {families}. Other families are shown for awareness; visibility grants nothing — every action is authorized inside its module."),
            { families: familiesLabel },
          )}
        </p>
      </section>
    </Shell>
  );
}
