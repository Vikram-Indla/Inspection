import Shell from "@/app/(app)/admin/_components/AdminShell";
import { supabaseServer } from "@/lib/supabase-server";
import { useT } from "@/lib/i18n";
import { NotYetBoundary } from "@/components/NotYetBoundary";
import EmptyState from "@/components/EmptyState";
import { ProposeDraftForm, DraftPayloadEditor, ApprovePublish, type WfStrings } from "./Controls";
import { WfDeck, type WfDeckStrings } from "./WfDeck";

export const dynamic = "force-dynamic";

// SCR-ADM-050/051 · ENG-03 — Workflow builder.
// Surface rebuilt against designs/admin/admin/SAQEEL Admin Workflow Builder.dc.html:
// breadcrumb + purpose line, lifecycle canvas, transition inspector, SLA model and
// the states/validation rail. Nothing on the page is invented: states, transitions,
// guards and actors come from the governed config_versions payload; the SLA model is
// read from sla_calendars and renders "Not configured" for every governed input
// DEC-003 has not supplied (durations, working calendar and escalation are not defaulted).

export default async function Workflows() {
  const { t } = await useT();
  const sb = await supabaseServer();
  const { data: { user } } = await sb.auth.getUser();
  const [{ data: wfs, error }, { data: calendars, error: calError }] = await Promise.all([
    sb.from("config_versions")
      .select("id, version_label, status, payload, effective_from, created_at, created_by, approved_by")
      .eq("engine", "workflow").order("effective_from", { ascending: false }),
    sb.from("sla_calendars")
      .select("id, name, version_label, timezone, working_days, working_start, working_end, activation_authorized")
      .order("name"),
  ]);
  if (error) console.error("[admin workflows] load failed", error);
  if (calError) console.error("[admin workflows] sla calendar load failed", calError);
  // Approval-chain visibility (RBAC-002 maker-checker): resolve maker/checker names.
  const chainIds = [...new Set((wfs ?? []).flatMap(w => [w.created_by, w.approved_by]).filter((x): x is string => !!x))];
  const profRes = chainIds.length ? await sb.from("profiles").select("user_id, full_name").in("user_id", chainIds) : null;
  const nameOf = (uid: string | null) => uid ? (profRes?.data?.find(p => p.user_id === uid)?.full_name ?? `${uid.slice(0, 8)}…`) : null;

  const notConfigured = t("common.notConfigured", "Not configured");

  const strings: WfStrings = {
    newVersionLabel: t("admin.wf.propose.label", "New version label"),
    proposing: t("admin.wf.propose.proposing", "Proposing…"),
    propose: t("admin.wf.propose.button", "Propose draft from this version"),
    draftCreated: t("admin.wf.propose.created", "draft created"),
    payloadLabel: t("admin.wf.editor.payloadLabel", "State machine payload (object · states[] · transitions[])"),
    saving: t("admin.wf.editor.saving", "Saving…"),
    saveDraft: t("admin.wf.editor.save", "Save draft"),
    saved: t("admin.wf.editor.saved", "saved"),
    publishing: t("admin.wf.publish.publishing", "Publishing…"),
    approvePublish: t("admin.wf.publish.approve", "Approve & publish"),
  };
  const deckStrings: WfDeckStrings = {
    ledgerTitle: t("admin.wf.deck.ledger", "Validation (VAL-01..06)"),
    graphTitle: t("admin.wf.deck.graph", "Lifecycle"),
    inspectorTitle: t("admin.wf.deck.inspector", "Transition inspector"),
    passed: t("admin.wf.deck.passed", "valid"),
    failed: t("admin.wf.deck.failed", "resolve before publishing"),
    initial: t("admin.wf.deck.initial", "initial"),
    terminal: t("admin.wf.deck.terminal", "terminal"),
    actor: t("admin.wf.deck.actor", "Actor"),
    guards: t("admin.wf.deck.guards", "Guards"),
    sideEffects: t("admin.wf.deck.sideEffects", "Side effects"),
    idempotent: t("admin.wf.deck.idempotent", "idempotent"),
    noIdempotencyKey: t("admin.wf.deck.noKey", "no idempotency key"),
    selectHint: t("admin.wf.deck.selectHint", "Select a state to filter its outgoing transitions; select a transition row to inspect it."),
    none: t("admin.wf.deck.none", "—"),
    statesTitle: t("admin.wf.deck.states", "States"),
    branchesTitle: t("admin.wf.deck.branches", "Branch transitions"),
    transitionTitle: t("admin.wf.deck.transition", "Transition"),
    allowedRole: t("admin.wf.deck.allowedRole", "Allowed role"),
    requires: t("admin.wf.deck.requires", "Requires"),
    trigger: t("admin.wf.deck.trigger", "Trigger"),
    notGoverned: notConfigured,
    authoredElsewhere: t("admin.wf.deck.authoredElsewhere", "Read-only view of the governed payload. Change it by proposing a draft and editing the state-machine payload below — publishing needs a distinct approver."),
    selectTransition: t("admin.wf.deck.selectTransition", "Select a transition from the table below to inspect its role, trigger, guards and side effects."),
  };

  return (
    <Shell current="/admin/workflows" title={t("admin.wf.title", "Workflow builder")}
      context={<span className="badge badge-info">SCR-ADM-050/051 · ENG-03</span>}>
      {/* Design header block — breadcrumb + purpose line. The governed actions
          (validate / publish) live on each version card: validation is the live
          VAL ledger in the rail, publishing needs a distinct checker. */}
      <div className="breadcrumb" style={{ marginBlockEnd: 8 }}>
        <span>{t("admin.wf.crumb.root", "Workflow Settings")}</span>
        <span className="sep">/</span>
        <span>{t("admin.wf.crumb.leaf", "Governed lifecycles")}</span>
      </div>
      <p className="t-caption" style={{ margin: "0 0 12px" }}>
        {t("admin.wf.subtitle", "States → transitions → guards & SLA · workflow_admin only · versioned")}
      </p>

      <div className="alert"><div>
        <strong>{t("admin.wf.banner.title", "Governed change only.")}</strong> {t("admin.wf.banner.before", "Runtime evaluates transitions against the published version — no status bypass (RBAC-003). Changes flow draft → distinct-approver publish (RBAC-002 maker-checker, enforced by a DB constraint on")} <code>config_versions</code>{t("admin.wf.banner.mid", "); published versions are immutable. Risk/SLA values live in")} <code>engine_settings</code> {t("admin.wf.banner.after", "and are not editable here.")}
      </div></div>
      {error && (
        <div className="alert alert-critical"><div>
          <strong>{t("admin.wf.error.title", "Couldn’t load workflow configuration. Nothing was changed. Try again.")}</strong>
        </div></div>
      )}
      {!error && (wfs ?? []).length === 0 && (
        <EmptyState glyph="🔀" title={t("admin.wf.empty.title", "No workflow configuration published")}
          body={t("admin.wf.empty.body", "Workflow state machines are versioned config (ENG-03).")} />
      )}
      {(wfs ?? []).map(w => {
        const p = w.payload as { object?: string };
        // RBAC-002 separation of duties: the maker cannot be the checker. When the
        // viewer proposed this draft, the DB will reject self-approval — so we
        // pre-empt it with an explanation rather than an Approve button that fails.
        const isOwnDraft = w.status === "draft" && !!user && w.created_by === user.id;
        return (
          <div key={w.id} className="panel" style={{ padding: "var(--space-6)", display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
            <div className="row" style={{ justifyContent: "space-between" }}>
              <h3>{t("admin.wf.object", "Object:")} {p.object ?? "—"} <span className="id-code">{w.version_label}</span></h3>
              <div className="row" style={{ gap: "var(--space-3)" }}>
                <span className={`badge ${w.status === "published" ? "badge-compliant" : "badge-warning"}`}>{t(`enum.${w.status}`, String(w.status).replace(/_/g, " "))}</span>
                {w.status === "draft" && !isOwnDraft && <ApprovePublish versionId={w.id} strings={strings} />}
                {isOwnDraft && (
                  <span className="badge badge-warning" title={t("admin.wf.sod.desc", "You proposed this draft (the maker). A different checker must approve it — separation of duties is enforced by a DB constraint.")}>
                    ⛔ {t("admin.wf.sod.title", "You proposed this — a distinct checker must approve")}
                  </span>
                )}
              </div>
            </div>
            {/* Approval chain — maker → checker, straight from config_versions (RBAC-002) */}
            <p className="t-caption">
              {t("admin.wf.chain.proposed", "Proposed by")} <strong>{nameOf(w.created_by) ?? "—"}</strong>
              {w.created_at && <> · <span className="numeric">{new Date(w.created_at).toISOString().slice(0, 16).replace("T", " ")}</span></>}
              {" → "}
              {w.approved_by
                ? <>{t("admin.wf.chain.approved", "approved by")} <strong>{nameOf(w.approved_by)}</strong> <span className="badge badge-compliant">{t("admin.wf.chain.distinct", "distinct approver")}</span></>
                : <>{t("admin.wf.chain.pending", "awaiting a distinct approver (maker-checker, DB-enforced)")}</>}
            </p>
            {/* Builder canvas — lifecycle lane, branch strip, transition inspector,
                states rail and the live VAL-01..06 validation rail. */}
            <WfDeck payload={w.payload} strings={deckStrings} />
            {w.status === "draft" && (
              <>
                <DraftPayloadEditor versionId={w.id} payload={w.payload as object} strings={strings} />
                {/* M2-02: the graph and the VAL-01..06 validation ledger above are now
                    real (WfDeck). The remaining honest boundary is the deterministic
                    simulation engine with fixtures + persisted replay/audit — the pure
                    evaluator exists (lib/workflow/transition), but the fixture store and
                    replay persistence are not built, so no run-replay is claimed here. */}
                <NotYetBoundary
                  title={t("admin.wf.sim.title", "Simulation fixtures & persisted replay")}
                  consequence={t("admin.wf.sim.desc", "The graph and validation ledger above are live; a persisted simulation/replay run (fixtures + audit) is not built yet, so no run history is shown.")}
                  seam="NEEDS_APPROVED_CONTRACT — simulation fixtures / replay persistence (GAP-02)"
                  prerequisites={[
                    t("admin.wf.sim.pre1", "A fixture store (sim_fixtures) and seed context"),
                    t("admin.wf.sim.pre2", "Persisted simulation runs (sim_runs) with audit"),
                  ]}
                  notAvailableLabel={t("admin.wf.notYet", "Not available yet")}
                  detailLabel={t("common.whyPrereq", "Why / prerequisites")}
                />
              </>
            )}
            {w.status === "published" && <ProposeDraftForm baseVersionId={w.id} baseLabel={w.version_label} strings={strings} />}
          </div>
        );
      })}

      {/* SLA model — the design's fourth panel. Deadlines, working calendar and
          escalation are governed inputs; DEC-003 has not supplied them, so every
          unsupplied value renders "Not configured" rather than an invented SLA. */}
      <section className="panel" style={{ padding: "18px 20px" }} aria-label={t("admin.wf.sla.title", "SLA model")}>
        <h3 style={{ fontSize: 15, fontWeight: 600, margin: "0 0 12px" }}>{t("admin.wf.sla.title", "SLA model")}</h3>
        {calError ? (
          <p className="t-caption" style={{ margin: 0 }}>{t("admin.wf.sla.loadError", "Couldn’t load the SLA calendars. Nothing was changed.")}</p>
        ) : (calendars ?? []).length === 0 ? (
          <p className="t-caption" style={{ margin: 0 }}>
            {t("admin.wf.sla.none", "No SLA calendar is configured. Deadlines, working days and escalation are governed inputs (DEC-003) — until one is authorised, timers stay pending and no deadline is shown.")}
          </p>
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead><tr>
                <th scope="col">{t("admin.wf.sla.calendar", "Calendar")}</th>
                <th scope="col">{t("admin.wf.sla.workingDays", "Working days")}</th>
                <th scope="col">{t("admin.wf.sla.hours", "Working hours")}</th>
                <th scope="col">{t("admin.wf.sla.timezone", "Timezone")}</th>
                <th scope="col">{t("admin.wf.sla.activation", "Activation")}</th>
              </tr></thead>
              <tbody>
                {(calendars ?? []).map(c => (
                  <tr key={c.id}>
                    <td>{c.name} <span className="t-caption">{c.version_label}</span></td>
                    <td>{(c.working_days ?? []).length ? (c.working_days as number[]).join(", ") : notConfigured}</td>
                    <td>{c.working_start && c.working_end ? `${c.working_start}–${c.working_end}` : notConfigured}</td>
                    <td>{c.timezone ?? notConfigured}</td>
                    <td>
                      <span className={`badge ${c.activation_authorized ? "badge-compliant" : "badge-warning"}`}>
                        {c.activation_authorized
                          ? t("admin.wf.sla.authorized", "Authorised")
                          : t("admin.wf.sla.pending", "Not authorised (DEC-003)")}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <p className="t-caption" style={{ margin: "12px 0 0" }}>
          {t("admin.wf.sla.note", "Deadlines are computed only from an authorised working calendar. There is no scheduler: a breach is never executed silently, and no default duration is assumed.")}
        </p>
      </section>
    </Shell>
  );
}
