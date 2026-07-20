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
  const control = buildShellNavigation(roles).find(g => g.id === "control");
  const actFamilies = (control?.items ?? [])
    .filter(i => i.id !== "admin-home")
    .map(i => t(i.labelKey, locale === "ar" ? i.labelAr : i.labelEn));
  const sep = locale === "ar" ? "، " : ", ";
  const roleLabel = roles.length ? roles.map(r => r.replace(/_/g, " ")).join(sep) : "—";
  const familiesLabel = actFamilies.length
    ? actFamilies.join(sep)
    : t("admin.overview.r2.scope.none", "none");

  const readAt = new Date().toISOString().slice(0, 16).replace("T", " ");
  const engines = enginesRes.data ?? [];

  // Read-state chip: glyph + word (never colour-only). "en" carries the count-unit noun;
  // the noun has no authored Arabic in the design pack, so Arabic relies on the Family
  // column for the unit (recorded as a localization gap in the CD-004 wiring audit).
  function chip(kind: "verified" | "verifiedZero" | "unavailable") {
    const glyph = kind === "unavailable" ? "✕" : "✓";
    const cls =
      kind === "verified" ? "ax-lozenge ax-lozenge--success"
      : kind === "verifiedZero" ? "ax-lozenge ax-lozenge--info"
      : "ax-lozenge ax-lozenge--warning";
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
    <span className="ax-numeric">
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
        <div className="ax-stack" style={{ gap: "var(--ax-space-050)" }}>
          {chip("verifiedZero")}
          {emptyHint ? <span className="ax-caption">{emptyHint}</span> : null}
        </div>
      );
    }
    return (
      <div className="ax-stack" style={{ gap: "var(--ax-space-050)" }}>
        {chip("verified")} {num(c, unitEn)}
      </div>
    );
  }

  const familyCompliance = t("admin.overview.r2.family.compliance", "Inspection Rules");
  const familyPackages = t("admin.overview.r2.family.packages", "Packages & Surveys");
  const familyEnforcement = t("admin.overview.r2.family.enforcement", "Violations & Penalties");
  const familyEngines = t("admin.overview.r2.family.engines", "Engine settings");
  const familyAudit = t("admin.overview.r2.family.audit", "Activity Log");
  const openTmpl = t("admin.overview.r2.open", "Open {family}");
  const openLink = (family: string, href: string) => (
    <a className="ax-btn ax-btn--secondary ax-link" href={href} aria-label={`${fill(openTmpl, { family })} — ${family}`}>
      {fill(openTmpl, { family })}
    </a>
  );

  const linkOnly = [
    { href: "/admin/items", key: "shell.nav.items", en: "Inspection Items" },
    { href: "/admin/workflows", key: "shell.nav.workflows", en: "Workflow Settings" },
    { href: "/admin/risk", key: "shell.nav.risk", en: "Risk Settings" },
    { href: "/admin/gis", key: "shell.nav.gis", en: "Map Settings" },
    { href: "/admin/access", key: "shell.nav.access", en: "Users & Roles" },
    { href: "/admin/localization", key: "shell.nav.localization", en: "Language & Translations" },
    { href: "/admin/audit", key: "shell.nav.audit", en: "Activity Log" },
  ];

  const readAtNode = withSlot(
    t("admin.overview.r2.readAt", "page read {time} — a source fact not a platform-health verdict"),
    "time",
    <bdi dir="ltr" className="ax-numeric">{readAt}</bdi>,
  );

  return (
    <Shell
      current="/admin"
      title={t("admin.overview.r2.title", "Approval & Configuration — overview")}
      context={
        <span className="ax-row" style={{ gap: "var(--ax-space-150)", alignItems: "center", flexWrap: "wrap" }}>
          <span role="status" aria-live="polite" className="ax-caption">{readAtNode}</span>
          {failed > 0 ? (
            <span className="ax-lozenge ax-lozenge--warning">
              <span aria-hidden="true">⚠</span>{" "}
              {fill(t("admin.overview.r2.lozenge.partial", "{n} source unavailable"), { n: failed })}
            </span>
          ) : null}
        </span>
      }
    >
      {/* Singleton assertive region (spec §8). Total failure is shown; a partial
          failure is announced sr-only, the visible fact living in the header lozenge. */}
      {total ? (
        <div className="ax-banner ax-banner--warning" role="alert">
          {t("admin.overview.r2.totalFailure", "Configuration sources couldn't be read. Nothing shown is current. Your session and navigation still work.")}
        </div>
      ) : failed > 0 ? (
        <div className="ax-sr-only" role="alert">
          {fill(t("admin.overview.r2.lozenge.partial", "{n} source unavailable"), { n: failed })}
        </div>
      ) : null}

      <section className="ax-surface ax-stack" aria-labelledby="cd004-spine-h" style={{ padding: "var(--ax-space-300)" }}>
        <h3 id="cd004-spine-h" style={{ margin: 0 }}>{t("admin.overview.r2.spine.caption", "Configuration evidence spine")}</h3>
        <div className="ax-tablewrap">
          <table className="ax-table">
            <caption className="ax-sr-only">{t("admin.overview.r2.spine.caption", "Configuration evidence spine")}</caption>
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
                <td className="ax-caption">{t("admin.overview.r2.lifecycle.regulations", "per-regulation status lives in the module; no update timestamp is read here")}</td>
                <td>{openLink(familyCompliance, "/admin/regulations")}</td>
              </tr>

              {/* Packages & Surveys — package_versions (published) + inspection_items */}
              <tr>
                <th scope="row">{familyPackages}</th>
                <td>
                  <div className="ax-stack" style={{ gap: "var(--ax-space-100)" }}>
                    {ok(pkgsRes) ? (
                      <span>{chip("verified")} {num(pkgsRes.count ?? 0, "published")}</span>
                    ) : chip("unavailable")}
                    {ok(itemsRes) ? (
                      <span>{chip("verified")} {num(itemsRes.count ?? 0, "items")}</span>
                    ) : chip("unavailable")}
                  </div>
                </td>
                <td className="ax-caption">{t("admin.overview.r2.lifecycle.packages", "draft/published proven · distinct approver enforced · immutable once published")}</td>
                <td>{openLink(familyPackages, "/admin/packages")}</td>
              </tr>

              {/* Enforcement Library — violation_codes (no lifecycle proven on this route) */}
              <tr>
                <th scope="row">{familyEnforcement}</th>
                <td>{countCell(viosRes, "violation codes")}</td>
                <td className="ax-caption" aria-hidden="true">—</td>
                <td>{openLink(familyEnforcement, "/admin/violations")}</td>
              </tr>

              {/* Engine settings — domain list + provenance (no dedicated route: data is the table) */}
              <tr>
                <th scope="row">{familyEngines}</th>
                <td>
                  {!ok(enginesRes) ? chip("unavailable")
                    : engines.length === 0 ? chip("verifiedZero")
                    : (
                      <div className="ax-stack" style={{ gap: "var(--ax-space-050)" }}>
                        <span>{chip("verified")} {num(engines.length, "domains")}</span>
                        <ul className="ax-stack" style={{ gap: "2px", listStyle: "none", margin: 0, padding: 0 }}>
                          {engines.map(e => (
                            <li key={e.engine} className="ax-caption">
                              <bdi dir="ltr">{e.engine}</bdi>
                              {" · "}
                              <span className="ax-version"><bdi dir="ltr">{e.version_label}</bdi></span>
                              {e.updated_at ? (
                                <> · <bdi dir="ltr" className="ax-numeric">{new Date(e.updated_at).toISOString().slice(0, 10)}</bdi></>
                              ) : null}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                </td>
                <td className="ax-caption">{t("admin.overview.r2.lifecycle.engines", "direct audited update — timestamp is provenance only")}</td>
                <td aria-hidden="true">—</td>
              </tr>

              {/* Audit trail — audit_events (no lifecycle proven on this route) */}
              <tr>
                <th scope="row">{familyAudit}</th>
                <td>{countCell(auditsRes, "events")}</td>
                <td className="ax-caption" aria-hidden="true">—</td>
                <td>{openLink(familyAudit, "/admin/audit")}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <nav className="ax-surface ax-stack" aria-labelledby="cd004-links-h" style={{ padding: "var(--ax-space-300)" }}>
        <h3 id="cd004-links-h" style={{ margin: 0 }}>
          {t("admin.overview.r2.linkOnly.heading", "Families this gateway reads no data for today — links only:")}
        </h3>
        <div className="ax-row" style={{ gap: "var(--ax-space-150)", flexWrap: "wrap" }}>
          {linkOnly.map(l => (
            <a key={l.href} className="ax-btn ax-btn--secondary ax-link" href={l.href}>
              {t(l.key, l.en)}
            </a>
          ))}
        </div>
      </nav>

      <section className="ax-surface ax-permission ax-stack" aria-labelledby="cd004-scope-h" style={{ padding: "var(--ax-space-300)" }}>
        <h3 id="cd004-scope-h" style={{ margin: 0 }}>
          {fill(t("admin.overview.r2.scope.heading", "Your scope — {role}"), { role: roleLabel })}
        </h3>
        <p className="ax-caption" style={{ margin: 0 }}>
          {fill(
            t("admin.overview.r2.scope.body", "You can act in {families}. Other families are shown for awareness; visibility grants nothing — every action is authorized inside its module."),
            { families: familiesLabel },
          )}
        </p>
      </section>
    </Shell>
  );
}
