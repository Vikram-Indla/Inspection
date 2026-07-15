import Shell from "@/components/Shell";
import { supabaseServer } from "@/lib/supabase-server";
import { useT } from "@/lib/i18n";
import { NotYetBoundary } from "@/components/NotYetBoundary";

export const dynamic = "force-dynamic";

// ENG-12 / FND-003 — audit trail browser over the append-only audit_events
// table. Read access is pure RLS (audit_read in 0002 + compliance_admin in
// 0019); a user without an audit-reading role sees zero rows, never an error.
// Filters ride the URL (GET form), pagination is 50/page.

const PAGE_SIZE = 50;
// Audited object types — the trigger list from migrations 0002 + 0009 (constants, not invented).
const AUDITED_TABLES = [
  "visit_plans", "visits", "assignments", "inspections", "submission_versions", "reviews",
  "violations", "action_forms", "package_versions", "regulations", "engine_settings", "user_roles",
  "virtual_participants",
] as const;
const ACTIONS = ["INSERT", "UPDATE", "DELETE", "OTP_SENT", "OTP_VERIFIED", "OTP_FAILED"] as const;

type Row = {
  id: number; actor: string | null; object_type: string; object_id: string | null;
  action: string; before_state: unknown; after_state: unknown; occurred_at: string;
};

export default async function AuditBrowser({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  const one = (k: string) => (typeof sp[k] === "string" ? (sp[k] as string) : "");
  const table = one("table"), action = one("action"), actor = one("actor"), from = one("from"), to = one("to");
  const page = Math.max(1, parseInt(one("page") || "1", 10) || 1);
  const { t } = await useT();
  const sb = await supabaseServer();

  let q = sb.from("audit_events")
    .select("id, actor, object_type, object_id, action, before_state, after_state, occurred_at", { count: "exact" })
    .order("occurred_at", { ascending: false })
    .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);
  if (table) q = q.eq("object_type", table);
  if (action) q = q.eq("action", action);
  if (actor === "system") q = q.is("actor", null);
  else if (actor) q = q.eq("actor", actor);
  if (from) q = q.gte("occurred_at", `${from}T00:00:00Z`);
  if (to) q = q.lte("occurred_at", `${to}T23:59:59.999Z`);
  const [{ data: rows, error, count }, { data: profs }] = await Promise.all([
    q,
    // profiles visibility is itself RLS-scoped (profiles_self); unknown actors fall back to short ids
    sb.from("profiles").select("user_id, full_name"),
  ]);
  if (error) console.error("[admin audit] load failed", error);
  const nameOf = (id: string | null) =>
    id === null ? t("admin.audit.systemActor", "system") : (profs ?? []).find(p => p.user_id === id)?.full_name ?? `${id.slice(0, 8)}…`;
  const events = (rows ?? []) as Row[];
  const total = count ?? 0;
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const qs = (p: number) => {
    const u = new URLSearchParams();
    if (table) u.set("table", table);
    if (action) u.set("action", action);
    if (actor) u.set("actor", actor);
    if (from) u.set("from", from);
    if (to) u.set("to", to);
    u.set("page", String(p));
    return `/admin/audit?${u.toString()}`;
  };
  const anyLabel = t("admin.audit.filter.any", "Any");
  const enumL = (x: string) => t(`enum.${x}`, x.replace(/_/g, " "));

  return (
    <Shell current="/admin" title={t("admin.audit.title", "Audit trail browser")}
      context={<><span className="ax-lozenge ax-lozenge--info">ENG-12</span><span className="ax-lozenge ax-lozenge--success">{t("admin.audit.appendOnly", "append-only · immutable")}</span></>}>
      <div className="ax-banner"><div>
        <strong>{t("admin.audit.banner.title", "Immutable record.")}</strong> {t("admin.audit.banner.body", "Every write to audited tables lands here via database trigger (0002); UPDATE/DELETE on audit_events is rejected at trigger level (0005). Visibility is enforced by RLS — audit-reading roles only.")}
      </div></div>

      {/* Filters — GET form so the view is linkable and paginates statelessly */}
      <form method="get" className="ax-surface ax-row" style={{ padding: "var(--ax-space-300)", flexWrap: "wrap", gap: "var(--ax-space-200)", alignItems: "flex-end" }}>
        <label className="ax-field">
          <span className="ax-field__label">{t("admin.audit.filter.table", "Table")}</span>
          <select className="ax-input" name="table" defaultValue={table}>
            <option value="">{anyLabel}</option>
            {AUDITED_TABLES.map(x => <option key={x} value={x}>{x}</option>)}
          </select>
        </label>
        <label className="ax-field">
          <span className="ax-field__label">{t("admin.audit.filter.action", "Action")}</span>
          <select className="ax-input" name="action" defaultValue={action}>
            <option value="">{anyLabel}</option>
            {ACTIONS.map(x => <option key={x} value={x}>{x}</option>)}
          </select>
        </label>
        <label className="ax-field">
          <span className="ax-field__label">{t("admin.audit.filter.actor", "Actor")}</span>
          <select className="ax-input" name="actor" defaultValue={actor}>
            <option value="">{anyLabel}</option>
            <option value="system">{t("admin.audit.systemActor", "system")}</option>
            {(profs ?? []).map(p => <option key={p.user_id} value={p.user_id}>{p.full_name}</option>)}
          </select>
        </label>
        <label className="ax-field">
          <span className="ax-field__label">{t("admin.audit.filter.from", "From (UTC)")}</span>
          <input className="ax-input" type="date" name="from" defaultValue={from} />
        </label>
        <label className="ax-field">
          <span className="ax-field__label">{t("admin.audit.filter.to", "To (UTC)")}</span>
          <input className="ax-input" type="date" name="to" defaultValue={to} />
        </label>
        <button className="ax-btn ax-btn--prominent" type="submit">{t("admin.audit.filter.apply", "Apply filters")}</button>
        <a className="ax-btn ax-btn--subtle" href="/admin/audit">{t("admin.audit.filter.reset", "Reset")}</a>
      </form>

      {error && (
        <div className="ax-banner ax-banner--critical"><div>
          <strong>{t("admin.audit.error", "Couldn’t load audit events. Nothing was changed. Try again.")}</strong>
        </div></div>
      )}

      {!error && events.length === 0 && (
        <div className="ax-surface"><div className="ax-state">
          <span className="ax-state__glyph">🛡</span>
          <h4>{t("admin.audit.empty.title", "No audit events visible")}</h4>
          <p className="ax-caption">{t("admin.audit.empty.desc", "Either nothing matches these filters, or your roles carry no audit read grant (auditor, ops, security_admin, leadership, reviewer, planner, compliance_admin — RLS).")}</p>
        </div></div>
      )}

      {!error && events.length > 0 && (
        <div className="ax-surface" style={{ padding: "var(--ax-space-300)" }}>
          <div className="ax-row" style={{ justifyContent: "space-between", marginBlockEnd: "var(--ax-space-150)" }}>
            <span className="ax-caption ax-numeric">{t("admin.audit.count", "{n} events · page {p}/{pp}").replace("{n}", String(total)).replace("{p}", String(page)).replace("{pp}", String(pages))}</span>
            <div className="ax-row" style={{ gap: "var(--ax-space-100)" }}>
              {page > 1 && <a className="ax-btn ax-btn--secondary" href={qs(page - 1)}>← {t("admin.audit.prev", "Newer")}</a>}
              {page < pages && <a className="ax-btn ax-btn--secondary" href={qs(page + 1)}>{t("admin.audit.next", "Older")} →</a>}
            </div>
          </div>
          <div className="ax-tablewrap"><table className="ax-table">
            <thead><tr>
              <th className="ax-td-num">{t("admin.audit.th.when", "Occurred (UTC)")}</th>
              <th>{t("admin.audit.th.actor", "Actor")}</th>
              <th>{t("admin.audit.th.table", "Table")}</th>
              <th>{t("admin.audit.th.action", "Action")}</th>
              <th>{t("admin.audit.th.object", "Object")}</th>
              <th>{t("admin.audit.th.detail", "Detail")}</th>
            </tr></thead>
            <tbody>
              {events.map(e => (
                <tr key={e.id}>
                  <td className="ax-td-num ax-numeric">{new Date(e.occurred_at).toISOString().slice(0, 19).replace("T", " ")}</td>
                  <td>{nameOf(e.actor)}</td>
                  <td><strong>{e.object_type}</strong></td>
                  <td><span className={`ax-lozenge ${e.action === "DELETE" ? "ax-lozenge--critical" : e.action === "INSERT" ? "ax-lozenge--success" : "ax-lozenge--info"}`}>{enumL(e.action)}</span></td>
                  <td className="ax-numeric">{e.object_id ? `${e.object_id.slice(0, 8)}…` : "—"}</td>
                  <td>
                    {/* Row detail expander — old/new state exactly as recorded */}
                    <details>
                      <summary className="ax-link" style={{ cursor: "pointer" }}>{t("admin.audit.expand", "old / new JSON")}</summary>
                      <div className="ax-conflict__grid" style={{ marginBlockStart: "var(--ax-space-100)" }}>
                        <div className="ax-conflict__side">
                          <h5>{t("admin.audit.before", "Before")}</h5>
                          <pre style={{ font: "var(--ax-text-micro)", whiteSpace: "pre-wrap", overflowWrap: "anywhere", maxBlockSize: 260, overflow: "auto" }}>{e.before_state ? JSON.stringify(e.before_state, null, 2) : "∅"}</pre>
                        </div>
                        <div className="ax-conflict__side">
                          <h5>{t("admin.audit.after", "After")}</h5>
                          <pre style={{ font: "var(--ax-text-micro)", whiteSpace: "pre-wrap", overflowWrap: "anywhere", maxBlockSize: 260, overflow: "auto" }}>{e.after_state ? JSON.stringify(e.after_state, null, 2) : "∅"}</pre>
                        </div>
                      </div>
                    </details>
                  </td>
                </tr>
              ))}
            </tbody>
          </table></div>
          <p className="ax-caption" style={{ marginBlockStart: "var(--ax-space-150)" }}>
            {t("admin.audit.rlsNote", "You see events your role is allowed to read. Events outside your scope are absent, not redacted rows.")}
          </p>
        </div>
      )}

      {/* R2 evidence grammar — capabilities deliberately absent from this reader.
          Shown as honest boundaries so their absence is legible, not a bug. */}
      {!error && (
        <div className="ax-grid-2" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "var(--ax-space-200)" }}>
          <NotYetBoundary
            title={t("admin.audit.corr.title", "Correlation / timeline view")}
            consequence={t("admin.audit.corr.desc", "Grouping events by a shared correlation across objects is a proposed read model — the current reader has no correlation column to group on.")}
            seam="NEEDS_APPROVED_CONTRACT — correlation read model"
            notAvailableLabel={t("admin.audit.notYet", "Not available yet")}
          />
          <NotYetBoundary
            title={t("admin.audit.reveal.title", "Sensitive reveal & export")}
            consequence={t("admin.audit.reveal.desc", "Revealing masked payload fields and exporting event sets need privacy, retention and audit contracts first. Neither action exists on this screen today.")}
            seam="BLOCKED_BY_DECISION — privacy / retention"
            notAvailableLabel={t("admin.audit.notYet", "Not available yet")}
          />
        </div>
      )}
    </Shell>
  );
}
